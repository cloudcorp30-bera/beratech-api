import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Clock,
  HardDrive,
  Zap,
  Gauge,
  Download,
  Search,
  Wrench,
  Sparkles,
  ChevronRight,
  Loader2,
  Copy,
  Play,
  X,
  Code,
  Bot,
  MapPin,
  Settings,
  Globe,
  Github,
  Twitter,
  Star,
  Cpu,
  Film,
} from "lucide-react";

interface EndpointInfo {
  path: string;
  method: string;
  description: string;
  text_inputs?: number;
}

interface StatsData {
  status: number;
  success: boolean;
  result: {
    uptime: string;
    uptime_seconds: number;
    memory: {
      used: string;
      total: string;
      used_bytes: number;
      total_bytes: number;
    };
    total_requests: number;
    api_status: string;
    response_rate: string;
    endpoints: Record<string, EndpointInfo[]>;
  };
}

const CATEGORY_META: Record<string, { icon: typeof Download; label: string; gradient: string; border: string; badge: string }> = {
  download:  { icon: Download, label: "Downloaders",         gradient: "from-blue-500/20 to-sky-500/10",     border: "border-blue-500/30",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  search:    { icon: Search,   label: "Search",              gradient: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  tools:     { icon: Wrench,   label: "Tools",               gradient: "from-amber-500/20 to-yellow-500/10", border: "border-amber-500/30",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  developer: { icon: Code,     label: "Developer Tools",     gradient: "from-cyan-500/20 to-sky-500/10",     border: "border-cyan-500/30",   badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  ai:        { icon: Bot,      label: "AI Tools",            gradient: "from-rose-500/20 to-red-500/10",     border: "border-rose-500/30",   badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  location:  { icon: MapPin,   label: "Location",            gradient: "from-green-500/20 to-lime-500/10",   border: "border-green-500/30",  badge: "bg-green-500/15 text-green-400 border-green-500/30" },
  utilities: { icon: Settings, label: "Utilities",           gradient: "from-orange-500/20 to-amber-500/10", border: "border-orange-500/30", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  ephoto360: { icon: Sparkles, label: "EPhoto360 Effects",   gradient: "from-purple-500/20 to-fuchsia-500/10",border: "border-purple-500/30",badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  stream:    { icon: Film,     label: "Stream Sources",      gradient: "from-pink-500/20 to-rose-500/10",     border: "border-pink-500/30",   badge: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
};

const EXAMPLE_URLS: Record<string, string> = {
  "/api/download/ytmp3": "/api/download/ytmp3?url=https://youtu.be/dQw4w9WgXcQ&quality=128kbps",
  "/api/download/ytmp4": "/api/download/ytmp4?url=https://youtu.be/dQw4w9WgXcQ&quality=720p",
  "/api/download/tiktok": "/api/download/tiktok?url=https://www.tiktok.com/@user/video/1234567890",
  "/api/download/movie": "/api/download/movie?id=786892",
  "/api/search/yts": "/api/search/yts?query=Rick+Astley&limit=5",
  "/api/search/lyrics": "/api/search/lyrics?query=Shape+of+You",
  "/api/search/wiki": "/api/search/wiki?query=Linux",
  "/api/tools/translate": "/api/tools/translate?text=Hello+world&to=es",
  "/api/tools/github": "/api/tools/github?username=torvalds",
  "/api/tools/quote": "/api/tools/quote",
  "/api/tools/screenshot": "/api/tools/screenshot?url=https://google.com",
  "/api/ephoto360/list": "/api/ephoto360/list",
  "/api/dev/hash": "/api/dev/hash?text=hello&algorithm=all",
  "/api/dev/base64/encode": "/api/dev/base64/encode?text=Hello+World",
  "/api/dev/base64/decode": "/api/dev/base64/decode?text=SGVsbG8gV29ybGQ=",
  "/api/dev/uuid": "/api/dev/uuid?count=5",
  "/api/dev/password": "/api/dev/password?length=16&symbols=true",
  "/api/dev/timestamp": "/api/dev/timestamp",
  "/api/dev/color": "/api/dev/color?color=%23FF5733",
  "/api/dev/jwt": "/api/dev/jwt?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.abc",
  "/api/dev/ip": "/api/dev/ip?ip=8.8.8.8",
  "/api/dev/dns": "/api/dev/dns?domain=google.com",
  "/api/dev/headers": "/api/dev/headers?url=https://google.com",
  "/api/dev/qrcode": "/api/dev/qrcode?text=https://example.com&size=300",
  "/api/dev/regex": "/api/dev/regex?pattern=%5Cd%2B&flags=g&text=abc123def456",
  "/api/dev/lorem": "/api/dev/lorem?count=3&type=paragraphs",
  "/api/dev/urlparse": "/api/dev/urlparse?url=https://example.com/path?key=value",
  "/api/dev/urlencode": "/api/dev/urlencode?text=Hello+World!&action=encode",
  "/api/dev/hmac": "/api/dev/hmac?text=Hello&secret=mykey&algorithm=sha256",
  "/api/dev/useragent": "/api/dev/useragent",
  "/api/dev/baseconvert": "/api/dev/baseconvert?value=255&from=10&to=16",
  "/api/dev/textstats": "/api/dev/textstats?text=Hello+world+this+is+a+test",
  "/api/dev/json": "/api/dev/json?json=%7B%22name%22%3A%22Bera%22%7D",
  "/api/dev/slug": "/api/dev/slug?text=Hello+World!&separator=-",
  "/api/dev/httpstatus": "/api/dev/httpstatus?code=404",
  "/api/dev/case": "/api/dev/case?text=hello_world&to=camel",
  "/api/dev/ipvalidate": "/api/dev/ipvalidate?ip=192.168.1.1",
  "/api/dev/bytes": "/api/dev/bytes?value=1024&from=KB&to=MB",
  "/api/dev/email": "/api/dev/email?email=test@gmail.com",
  "/api/dev/htmlentities": "/api/dev/htmlentities?text=%3Cp%3EHello%3C/p%3E&action=encode",
  "/api/dev/morse": "/api/dev/morse?text=Hello+World&action=encode",
  "/api/dev/randomdata": "/api/dev/randomdata?count=3",
  "/api/dev/diff": "/api/dev/diff?text1=hello+world&text2=hello+there",
  "/api/dev/cron": "/api/dev/cron?expression=*/5+*+*+*+*",
  "/api/dev/ssl": "/api/dev/ssl?domain=google.com",
  "/api/dev/markdown": "/api/dev/markdown?text=%23+Hello+**World**",
  "/api/dev/csv2json": "/api/dev/csv2json?csv=name,age%0AAlice,30&delimiter=,",
  "/api/dev/jwt/generate": "/api/dev/jwt/generate?payload=%7B%22sub%22%3A%22user1%22%7D&secret=mykey&expiresIn=3600",
  "/api/dev/cidr": "/api/dev/cidr?cidr=192.168.1.0/24",
  "/api/dev/directory": "/api/dev/directory?category=AI",
  "/api/ai/chat": "/api/ai/chat?prompt=What+is+Node.js?",
  "/api/ai/summarize": "/api/ai/summarize?text=Artificial+intelligence+is+a+branch+of+computer+science",
  "/api/ai/codegen": "/api/ai/codegen?prompt=fibonacci+function&language=python",
  "/api/ai/translate": "/api/ai/translate?text=Hello+world&to=Spanish",
  "/api/ai/analyze": "/api/ai/analyze?text=I+love+this+product&type=sentiment",
  "/api/ai/imagine": "/api/ai/imagine?prompt=a+sunset+over+mountains",
  "/api/ai/explain": "/api/ai/explain?code=const+x+%3D+arr.map(i+%3D%3E+i*2)&language=javascript",
  "/api/ai/debug": "/api/ai/debug?code=for(let+i%3D0%3Bi%3C10%3Bi%2B%2B)console.log(i)&language=javascript",
  "/api/ai/review": "/api/ai/review?code=function+add(a,b){return+a%2Bb}&language=javascript",
  "/api/ai/commit": "/api/ai/commit?diff=Added+login+form+component&style=conventional",
  "/api/ai/unittest": "/api/ai/unittest?code=function+add(a,b){return+a%2Bb}&language=javascript&framework=jest",
  "/api/ai/sql": "/api/ai/sql?prompt=get+all+users+over+18&dialect=postgresql",
  "/api/ai/regex": "/api/ai/regex?description=match+email+addresses&flavor=javascript",
  "/api/ai/docstring": "/api/ai/docstring?code=function+add(a,b){return+a%2Bb}&language=javascript&style=jsdoc",
  "/api/ai/refactor": "/api/ai/refactor?code=function+add(a,b){return+a%2Bb}&language=javascript&goal=readability",
  "/api/ai/complexity": "/api/ai/complexity?code=function+sort(arr){return+arr.sort()}&language=javascript",
  "/api/ai/tts": "/api/ai/tts?text=Hello,+how+are+you?&voice=alloy&speed=1.0",
  "/api/ai/voicetranslate": "/api/ai/voicetranslate?text=Hello+world&to=Spanish&voice=nova",
  "/api/location/geoip": "/api/location/geoip?ip=8.8.8.8",
  "/api/location/reverse": "/api/location/reverse?lat=40.7128&lon=-74.0060",
  "/api/location/timezone": "/api/location/timezone?lat=40.7128&lon=-74.0060",
  "/api/location/device": "/api/location/device",
  "/api/utils/weather": "/api/utils/weather?location=London",
  "/api/utils/crypto": "/api/utils/crypto?coin=bitcoin&currency=usd",
  "/api/utils/currency": "/api/utils/currency?from=USD&to=EUR&amount=100",
  "/api/utils/shorten": "/api/utils/shorten?url=https://example.com/very/long/path",
  "/api/utils/whois": "/api/utils/whois?domain=google.com",
  "/api/utils/phone": "/api/utils/phone?phone=%2B14155552671",
  "/api/utils/news": "/api/utils/news?source=hackernews&limit=5",
  "/api/utils/gitignore": "/api/utils/gitignore?templates=node,python",
  "/api/utils/metadata": "/api/utils/metadata?url=https://github.com",
  "/api/utils/uptime": "/api/utils/uptime?url=https://google.com",
  "/api/vidlink/movie": "/api/vidlink/movie?id=786892",
  "/api/vidlink/tv": "/api/vidlink/tv?id=94997&season=1&episode=1",
  "/api/vidlink/anime": "/api/vidlink/anime?mal_id=21&episode=1&dub=false",
};

const STATIC_PARAMS: Record<string, Array<{ key: string; placeholder: string; required: boolean }>> = {
  "/api/download/ytmp3": [
    { key: "url", placeholder: "YouTube URL (e.g. https://youtu.be/dQw4w9WgXcQ)", required: true },
    { key: "quality", placeholder: "Quality (128kbps, 320kbps)", required: false },
  ],
  "/api/download/ytmp4": [
    { key: "url", placeholder: "YouTube URL", required: true },
    { key: "quality", placeholder: "Quality (360p, 720p)", required: false },
  ],
  "/api/download/tiktok": [{ key: "url", placeholder: "TikTok URL", required: true }],
  "/api/download/movie": [
    { key: "id", placeholder: "TMDB movie ID (e.g. 786892 for Furiosa)", required: true },
  ],
  "/api/search/yts": [
    { key: "query", placeholder: "Search term (e.g. Rick Astley)", required: true },
    { key: "limit", placeholder: "Limit (default: 10)", required: false },
  ],
  "/api/search/lyrics": [{ key: "query", placeholder: "Song name (e.g. Shape of You)", required: true }],
  "/api/search/wiki": [{ key: "query", placeholder: "Search term (e.g. Linux)", required: true }],
  "/api/tools/translate": [
    { key: "text", placeholder: "Text to translate", required: true },
    { key: "to", placeholder: "Target language code (e.g. es, fr)", required: true },
    { key: "from", placeholder: "Source language (default: en)", required: false },
  ],
  "/api/tools/github": [{ key: "username", placeholder: "GitHub username (e.g. torvalds)", required: true }],
  "/api/tools/quote": [],
  "/api/tools/screenshot": [{ key: "url", placeholder: "Website URL (e.g. https://google.com)", required: true }],
  "/api/ephoto360/list": [],
  "/api/dev/hash": [
    { key: "text", placeholder: "Text to hash (e.g. hello)", required: true },
    { key: "algorithm", placeholder: "Algorithm: all, md5, sha256 (default: all)", required: false },
  ],
  "/api/dev/base64/encode": [{ key: "text", placeholder: "Text to encode", required: true }],
  "/api/dev/base64/decode": [{ key: "text", placeholder: "Base64 string to decode", required: true }],
  "/api/dev/uuid": [{ key: "count", placeholder: "Count (default: 1, max: 50)", required: false }],
  "/api/dev/password": [
    { key: "length", placeholder: "Length (default: 16)", required: false },
    { key: "symbols", placeholder: "Include symbols? true/false", required: false },
  ],
  "/api/dev/timestamp": [{ key: "input", placeholder: "Unix timestamp or date (default: now)", required: false }],
  "/api/dev/color": [{ key: "color", placeholder: "Color (e.g. #FF5733 or rgb(255,87,51))", required: true }],
  "/api/dev/jwt": [{ key: "token", placeholder: "JWT token string", required: true }],
  "/api/dev/ip": [{ key: "ip", placeholder: "IP address (e.g. 8.8.8.8)", required: true }],
  "/api/dev/dns": [{ key: "domain", placeholder: "Domain (e.g. google.com)", required: true }],
  "/api/dev/headers": [{ key: "url", placeholder: "URL (e.g. https://google.com)", required: true }],
  "/api/dev/qrcode": [
    { key: "text", placeholder: "Text or URL to encode", required: true },
    { key: "size", placeholder: "Size in px (default: 300)", required: false },
  ],
  "/api/dev/regex": [
    { key: "pattern", placeholder: "Regex pattern (e.g. \\d+)", required: true },
    { key: "flags", placeholder: "Flags (e.g. g, i)", required: false },
    { key: "text", placeholder: "Test string", required: true },
  ],
  "/api/dev/lorem": [
    { key: "count", placeholder: "Count (default: 3)", required: false },
    { key: "type", placeholder: "paragraphs, sentences, or words", required: false },
  ],
  "/api/dev/urlparse": [{ key: "url", placeholder: "URL to parse", required: true }],
  "/api/dev/urlencode": [
    { key: "text", placeholder: "Text to encode/decode", required: true },
    { key: "action", placeholder: "encode or decode (default: encode)", required: false },
  ],
  "/api/dev/hmac": [
    { key: "text", placeholder: "Message to sign", required: true },
    { key: "secret", placeholder: "Secret key", required: true },
    { key: "algorithm", placeholder: "sha256, sha512, md5 (default: sha256)", required: false },
  ],
  "/api/dev/useragent": [{ key: "ua", placeholder: "User agent string (default: yours)", required: false }],
  "/api/dev/baseconvert": [
    { key: "value", placeholder: "Number (e.g. 255)", required: true },
    { key: "from", placeholder: "From base (default: 10)", required: false },
    { key: "to", placeholder: "To base (default: 16)", required: false },
  ],
  "/api/dev/textstats": [{ key: "text", placeholder: "Text to analyze", required: true }],
  "/api/dev/json": [{ key: "json", placeholder: '{"key": "value"}', required: true }],
  "/api/dev/slug": [
    { key: "text", placeholder: "Text to slugify (e.g. Hello World!)", required: true },
    { key: "separator", placeholder: "Separator (default: -)", required: false },
  ],
  "/api/dev/httpstatus": [{ key: "code", placeholder: "Status code (e.g. 404) or leave empty for all", required: false }],
  "/api/dev/case": [
    { key: "text", placeholder: "Text (e.g. hello_world)", required: true },
    { key: "to", placeholder: "camel, pascal, snake, kebab, constant, title", required: false },
  ],
  "/api/dev/ipvalidate": [{ key: "ip", placeholder: "IP address (e.g. 192.168.1.1)", required: true }],
  "/api/dev/bytes": [
    { key: "value", placeholder: "Number (e.g. 1024)", required: true },
    { key: "from", placeholder: "From unit: B, KB, MB, GB, TB (default: B)", required: false },
    { key: "to", placeholder: "To unit (optional)", required: false },
  ],
  "/api/dev/email": [{ key: "email", placeholder: "Email address (e.g. test@gmail.com)", required: true }],
  "/api/dev/htmlentities": [
    { key: "text", placeholder: "HTML text (e.g. <p>Hello</p>)", required: true },
    { key: "action", placeholder: "encode or decode (default: encode)", required: false },
  ],
  "/api/dev/morse": [
    { key: "text", placeholder: "Text or Morse code", required: true },
    { key: "action", placeholder: "encode or decode (default: encode)", required: false },
  ],
  "/api/dev/randomdata": [{ key: "count", placeholder: "Count (default: 1, max: 50)", required: false }],
  "/api/dev/diff": [
    { key: "text1", placeholder: "First text", required: true },
    { key: "text2", placeholder: "Second text", required: true },
  ],
  "/api/dev/cron": [{ key: "expression", placeholder: "Cron expression (e.g. */5 * * * *)", required: true }],
  "/api/dev/ssl": [{ key: "domain", placeholder: "Domain (e.g. google.com)", required: true }],
  "/api/dev/markdown": [{ key: "text", placeholder: "Markdown text (e.g. # Hello **World**)", required: true }],
  "/api/dev/csv2json": [
    { key: "csv", placeholder: "CSV data (e.g. name,age\\nAlice,30)", required: true },
    { key: "delimiter", placeholder: "Delimiter (default: ,)", required: false },
  ],
  "/api/dev/jwt/generate": [
    { key: "payload", placeholder: 'JSON payload (e.g. {"sub":"user1"})', required: true },
    { key: "secret", placeholder: "Secret key", required: true },
    { key: "expiresIn", placeholder: "Expiry in seconds (optional)", required: false },
  ],
  "/api/dev/cidr": [{ key: "cidr", placeholder: "CIDR notation (e.g. 192.168.1.0/24)", required: true }],
  "/api/dev/directory": [{ key: "category", placeholder: "Category filter (optional, e.g. AI, Database)", required: false }],
  "/api/ai/chat": [
    { key: "prompt", placeholder: "Your message (e.g. What is Node.js?)", required: true },
    { key: "system", placeholder: "System prompt (optional)", required: false },
  ],
  "/api/ai/summarize": [
    { key: "text", placeholder: "Text to summarize", required: true },
    { key: "maxLength", placeholder: "Max words (optional)", required: false },
  ],
  "/api/ai/codegen": [
    { key: "prompt", placeholder: "Describe what code to generate", required: true },
    { key: "language", placeholder: "Language (e.g. python, javascript)", required: false },
  ],
  "/api/ai/translate": [
    { key: "text", placeholder: "Text to translate", required: true },
    { key: "to", placeholder: "Target language (e.g. Spanish, French, Japanese)", required: true },
    { key: "from", placeholder: "Source language (optional, auto-detected)", required: false },
  ],
  "/api/ai/analyze": [
    { key: "text", placeholder: "Text to analyze", required: true },
    { key: "type", placeholder: "Type: sentiment, grammar, keywords, readability, general", required: false },
  ],
  "/api/ai/imagine": [
    { key: "prompt", placeholder: "Describe the image (e.g. a sunset over mountains)", required: true },
    { key: "size", placeholder: "Size: 1024x1024, 512x512, 256x256", required: false },
  ],
  "/api/ai/explain": [
    { key: "code", placeholder: "Code to explain (e.g. const x = arr.map(i => i*2))", required: true },
    { key: "language", placeholder: "Language (optional)", required: false },
  ],
  "/api/ai/debug": [
    { key: "code", placeholder: "Code to debug", required: true },
    { key: "error", placeholder: "Error message (optional)", required: false },
    { key: "language", placeholder: "Language (optional)", required: false },
  ],
  "/api/ai/review": [
    { key: "code", placeholder: "Code to review", required: true },
    { key: "language", placeholder: "Language (optional)", required: false },
  ],
  "/api/ai/commit": [
    { key: "diff", placeholder: "Git diff or code changes description", required: true },
    { key: "style", placeholder: "Style: conventional, simple, detailed", required: false },
  ],
  "/api/ai/unittest": [
    { key: "code", placeholder: "Code to generate tests for", required: true },
    { key: "language", placeholder: "Language (optional)", required: false },
    { key: "framework", placeholder: "Test framework (e.g. jest, pytest)", required: false },
  ],
  "/api/ai/sql": [
    { key: "prompt", placeholder: "Describe your query (e.g. get all users over 18)", required: true },
    { key: "dialect", placeholder: "SQL dialect: postgresql, mysql, sqlite", required: false },
    { key: "schema", placeholder: "Table schema context (optional)", required: false },
  ],
  "/api/ai/regex": [
    { key: "description", placeholder: "Describe the pattern (e.g. match email addresses)", required: true },
    { key: "flavor", placeholder: "Regex flavor: javascript, python, pcre", required: false },
  ],
  "/api/ai/docstring": [
    { key: "code", placeholder: "Code to document", required: true },
    { key: "language", placeholder: "Language (optional)", required: false },
    { key: "style", placeholder: "Style: jsdoc, google, numpy, sphinx", required: false },
  ],
  "/api/ai/refactor": [
    { key: "code", placeholder: "Code to refactor", required: true },
    { key: "language", placeholder: "Language (optional)", required: false },
    { key: "goal", placeholder: "Goal: performance, readability, dry, modern", required: false },
  ],
  "/api/ai/complexity": [
    { key: "code", placeholder: "Code to analyze", required: true },
    { key: "language", placeholder: "Language (optional)", required: false },
  ],
  "/api/ai/tts": [
    { key: "text", placeholder: "Text to speak (e.g. Hello, how are you?)", required: true },
    { key: "voice", placeholder: "Voice: alloy, echo, fable, onyx, nova, shimmer", required: false },
    { key: "speed", placeholder: "Speed: 0.25 to 4.0 (default 1.0)", required: false },
  ],
  "/api/ai/voicetranslate": [
    { key: "text", placeholder: "Text to translate and speak", required: true },
    { key: "to", placeholder: "Target language (e.g. Spanish, French)", required: true },
    { key: "voice", placeholder: "Voice: alloy, echo, fable, onyx, nova, shimmer", required: false },
    { key: "from", placeholder: "Source language (optional, auto-detected)", required: false },
  ],
  "/api/location/geoip": [{ key: "ip", placeholder: "IP address (leave empty for your IP)", required: false }],
  "/api/location/reverse": [
    { key: "lat", placeholder: "Latitude (e.g. 40.7128)", required: true },
    { key: "lon", placeholder: "Longitude (e.g. -74.0060)", required: true },
  ],
  "/api/location/timezone": [
    { key: "lat", placeholder: "Latitude (e.g. 40.7128)", required: true },
    { key: "lon", placeholder: "Longitude (e.g. -74.0060)", required: true },
  ],
  "/api/location/device": [
    { key: "ua", placeholder: "User agent string (leave empty for yours)", required: false },
    { key: "ip", placeholder: "IP for location (optional)", required: false },
  ],
  "/api/utils/weather": [{ key: "location", placeholder: "City or location (e.g. London, New York)", required: true }],
  "/api/utils/crypto": [
    { key: "coin", placeholder: "Coin name or symbol (e.g. bitcoin, eth)", required: true },
    { key: "currency", placeholder: "Currency: usd, eur, gbp (default usd)", required: false },
  ],
  "/api/utils/currency": [
    { key: "from", placeholder: "From currency (e.g. USD)", required: true },
    { key: "to", placeholder: "To currency (e.g. EUR)", required: true },
    { key: "amount", placeholder: "Amount (default 1)", required: false },
  ],
  "/api/utils/shorten": [{ key: "url", placeholder: "URL to shorten (e.g. https://example.com/long-path)", required: true }],
  "/api/utils/whois": [{ key: "domain", placeholder: "Domain name (e.g. google.com)", required: true }],
  "/api/utils/phone": [
    { key: "phone", placeholder: "Phone number (e.g. +14155552671)", required: true },
    { key: "country_code", placeholder: "Country code (optional, e.g. US)", required: false },
  ],
  "/api/utils/news": [
    { key: "source", placeholder: "Source: hackernews (default)", required: false },
    { key: "limit", placeholder: "Number of articles (default 10, max 30)", required: false },
  ],
  "/api/utils/gitignore": [{ key: "templates", placeholder: "Templates (e.g. node,python,vscode)", required: true }],
  "/api/utils/metadata": [{ key: "url", placeholder: "Website URL to scrape metadata from", required: true }],
  "/api/utils/uptime": [{ key: "url", placeholder: "URL to check (e.g. https://google.com)", required: true }],
  "/api/vidlink/movie": [
      { key: "id", placeholder: "TMDB movie ID (e.g. 786892 for Furiosa)", required: true },
    ],
    "/api/vidlink/tv": [
      { key: "id", placeholder: "TMDB TV show ID (e.g. 94997 for House of the Dragon)", required: true },
      { key: "season", placeholder: "Season number (default: 1)", required: false },
      { key: "episode", placeholder: "Episode number (default: 1)", required: false },
    ],
    "/api/vidlink/anime": [
      { key: "mal_id", placeholder: "MyAnimeList ID (e.g. 21 for One Piece)", required: true },
      { key: "episode", placeholder: "Episode number (default: 1)", required: false },
      { key: "dub", placeholder: "Prefer dubbed? true/false (default: false)", required: false },
    ],
};

function getEndpointParams(ep: EndpointInfo): Array<{ key: string; placeholder: string; required: boolean }> {
  if (STATIC_PARAMS[ep.path]) return STATIC_PARAMS[ep.path];
  if (ep.path.startsWith("/api/ephoto360/")) {
    const inputs = ep.text_inputs || 1;
    if (inputs === 1) return [{ key: "text", placeholder: "Your text", required: true }];
    if (inputs === 2) return [
      { key: "text1", placeholder: "First text", required: true },
      { key: "text2", placeholder: "Second text", required: true },
    ];
    return [
      { key: "text1", placeholder: "First text", required: true },
      { key: "text2", placeholder: "Second text", required: true },
      { key: "text3", placeholder: "Third text", required: true },
    ];
  }
  return [];
}

function getExampleUrl(ep: EndpointInfo): string {
  if (EXAMPLE_URLS[ep.path]) return EXAMPLE_URLS[ep.path];
  if (ep.path.startsWith("/api/ephoto360/") && ep.path !== "/api/ephoto360/list") {
    const inputs = ep.text_inputs || 1;
    if (inputs === 1) return `${ep.path}?text=Bera`;
    if (inputs === 2) return `${ep.path}?text1=Bera&text2=Tech`;
    return `${ep.path}?text1=Bera&text2=Tech&text3=API`;
  }
  return ep.path;
}

function EndpointTestCard({ ep }: { ep: EndpointInfo }) {
  const [testing, setTesting] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const endpointParams = getEndpointParams(ep);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const exampleUrl = getExampleUrl(ep);
  const fullExampleUrl = baseUrl + exampleUrl;

  const copyEndpoint = () => {
    navigator.clipboard.writeText(fullExampleUrl);
    toast({ title: "Copied to clipboard", description: "Full API URL copied" });
  };

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const qs = new URLSearchParams();
      for (const p of endpointParams) {
        const val = params[p.key];
        if (val) qs.set(p.key, val);
      }
      const url = endpointParams.length > 0 ? `${ep.path}?${qs.toString()}` : ep.path;
      const res = await fetch(url);
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult(JSON.stringify({ error: err?.message || "Request failed" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <div
      className="rounded-xl border border-[#1E1E2E] bg-[#14141F] hover:border-indigo-500/40 transition-all duration-200 overflow-hidden"
      data-testid={`endpoint-card-${ep.path.replace(/\//g, "-").slice(1)}`}
      style={{ boxShadow: "0 4px 12px -4px rgba(0,0,0,0.4)" }}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              {ep.method}
            </span>
            <span className="text-sm font-medium text-white/90">{ep.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {ep.text_inputs && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/25">
                {ep.text_inputs === 1 ? "1 text" : `${ep.text_inputs} texts`}
              </span>
            )}
            <Button
              variant={testing ? "default" : "outline"}
              size="sm"
              className={testing
                ? "bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-7 text-xs px-2.5"
                : "border-[#1E1E2E] bg-transparent hover:bg-white/5 text-white/70 h-7 text-xs px-2.5"}
              onClick={() => {
                setTesting(!testing);
                if (testing) { setResult(null); setParams({}); }
              }}
              data-testid={`button-test-${ep.path.replace(/\//g, "-").slice(1)}`}
            >
              {testing ? <><X className="w-3 h-3 mr-1" /> Close</> : <><Play className="w-3 h-3 mr-1" /> Test</>}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex-1 min-w-0 bg-black/30 rounded-lg px-3 py-1.5 font-mono text-xs text-indigo-300/70 overflow-x-auto whitespace-nowrap border border-[#1E1E2E]"
            data-testid={`text-endpoint-url-${ep.path.replace(/\//g, "-").slice(1)}`}
          >
            {fullExampleUrl}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 w-7 h-7 hover:bg-white/5 text-white/40 hover:text-white/70"
            onClick={copyEndpoint}
            data-testid={`button-copy-url-${ep.path.replace(/\//g, "-").slice(1)}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {testing && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#1E1E2E] pt-3">
          {endpointParams.length > 0 ? (
            <div className="space-y-2">
              {endpointParams.map((p) => (
                <div key={p.key} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 shrink-0 w-20">
                    <code className="text-xs font-mono text-indigo-400">{p.key}</code>
                    {p.required && <span className="text-red-400 text-xs">*</span>}
                  </div>
                  <Input
                    className="text-sm bg-black/30 border-[#1E1E2E] text-white/80 placeholder:text-white/25 focus:border-indigo-500/50 h-8"
                    placeholder={p.placeholder}
                    value={params[p.key] || ""}
                    onChange={(e) => setParams({ ...params, [p.key]: e.target.value })}
                    data-testid={`input-param-${p.key}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30">No parameters required</p>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 h-8"
              onClick={runTest}
              disabled={loading}
              data-testid={`button-run-test-${ep.path.replace(/\//g, "-").slice(1)}`}
            >
              {loading ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Testing...</>
              ) : (
                <><Play className="w-3 h-3 mr-1" /> Send Request</>
              )}
            </Button>
            {result && (
              <Button
                variant="outline"
                size="sm"
                className="border-[#1E1E2E] bg-transparent hover:bg-white/5 text-white/60 h-8"
                onClick={copyResult}
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            )}
          </div>

          {result && (
            <pre
              className="text-xs bg-black/40 p-3 rounded-lg font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap break-all text-emerald-300/80 border border-[#1E1E2E]"
              data-testid="text-test-result"
            >
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const stats = data?.result;
  const memPercent = stats ? Math.round((stats.memory.used_bytes / stats.memory.total_bytes) * 100) : 0;

  const totalEndpoints = stats?.endpoints
    ? Object.values(stats.endpoints).reduce((acc, arr) => acc + arr.length, 0)
    : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
            data-testid="text-dashboard-title"
          >
            Bera API Dashboard
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            API v3.0 — Status & Endpoint Testing
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium"
          data-testid="badge-status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </div>
      </div>

      {/* ── Developer Card ── */}
      <div
        className="rounded-2xl border border-[#1E1E2E] overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #14141F 0%, #1a1025 40%, #0f1a2e 100%)",
          boxShadow: "0 8px 32px -8px rgba(99,102,241,0.2)",
        }}
        data-testid="card-developer-profile"
      >
        <div className="absolute inset-0 opacity-30" style={{
          background: "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 50%)",
        }} />
        <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/40" style={{ boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}>
              <img
                src="/api/proxy/avatar"
                alt="Bruce Bera"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/initials/svg?seed=BB&backgroundColor=6366f1&textColor=ffffff&radius=12`;
                }}
                data-testid="img-developer-avatar"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#14141F] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white" data-testid="text-developer-name">Bruce Bera</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                API Developer
              </span>
            </div>
            <p className="text-sm text-white/50 mb-3">
              Building high-performance REST APIs with 75+ tools, AI integrations, and developer utilities — all in one platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>beratech API</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>{totalEndpoints > 0 ? `${totalEndpoints}+ endpoints` : "100+ endpoints"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Free & Open API</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>99.9% uptime</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-lg font-bold text-indigo-300" data-testid="text-total-endpoints">{totalEndpoints || "100"}+</p>
              <p className="text-xs text-white/40">Endpoints</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl border border-[#1E1E2E] p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #14141F, #1a1535)" }}
          data-testid="card-stat-uptime"
        >
          <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-indigo-500/8" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Uptime</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-28 bg-white/5 animate-pulse rounded" />
          ) : (
            <p className="text-base font-bold text-white" data-testid="text-uptime">
              {stats?.uptime || "—"}
            </p>
          )}
        </div>

        <div
          className="rounded-xl border border-[#1E1E2E] p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #14141F, #1a1030)" }}
          data-testid="card-stat-memory"
        >
          <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-violet-500/8" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <HardDrive className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">RAM</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-28 bg-white/5 animate-pulse rounded" />
          ) : (
            <div>
              <p className="text-base font-bold text-white" data-testid="text-memory">
                {stats?.memory?.used || "—"} / {stats?.memory?.total || "—"}
              </p>
              <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${memPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-xl border border-[#1E1E2E] p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #14141F, #0d2018)" }}
          data-testid="card-stat-requests"
        >
          <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-emerald-500/8" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Requests</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-16 bg-white/5 animate-pulse rounded" />
          ) : (
            <p className="text-base font-bold text-white" data-testid="text-requests">
              {stats?.total_requests?.toLocaleString() || "0"}
            </p>
          )}
        </div>

        <div
          className="rounded-xl border border-[#1E1E2E] p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #14141F, #1f1608)" }}
          data-testid="card-stat-response"
        >
          <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-amber-500/8" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Response</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-20 bg-white/5 animate-pulse rounded" />
          ) : (
            <p className="text-base font-bold text-white" data-testid="text-response-rate">
              {stats?.response_rate || "—"}
            </p>
          )}
        </div>
      </div>

      {/* ── System Health ── */}
      <div
        className="rounded-xl border border-[#1E1E2E] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{ background: "#14141F" }}
        data-testid="card-system-health"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <span className="text-sm font-semibold text-white">System Health</span>
            <span className="ml-2 text-xs text-white/30">All endpoints operational</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/35">
          <span>Status: <span className="text-emerald-400 font-medium">Online</span></span>
          <span>Response: <span className="text-indigo-300 font-medium">{stats?.response_rate || "—"}</span></span>
          <span>Requests: <span className="text-violet-300 font-medium">{stats?.total_requests?.toLocaleString() || "0"}</span></span>
        </div>
      </div>

      {/* ── Endpoint Categories ── */}
      {stats?.endpoints && Object.entries(stats.endpoints).map(([category, endpoints], catIdx) => {
        const meta = CATEGORY_META[category] || {
          icon: ChevronRight,
          label: category,
          gradient: "from-white/5 to-transparent",
          border: "border-white/10",
          badge: "bg-white/10 text-white/50 border-white/15",
        };
        const Icon = meta.icon;

        return (
          <div
            key={category}
            className="space-y-3"
            style={{ animationDelay: `${0.1 + catIdx * 0.08}s` }}
            data-testid={`section-category-${category}`}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${meta.gradient} border ${meta.border}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.badge}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex-1">
                {meta.label}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.badge}`}>
                {endpoints.length}
              </span>
            </div>

            <div className="space-y-2 pl-1">
              {endpoints.map((ep: EndpointInfo) => (
                <EndpointTestCard key={ep.path} ep={ep} />
              ))}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/3 animate-pulse rounded-xl border border-[#1E1E2E]" />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="text-center py-4 text-xs text-white/20 border-t border-[#1E1E2E]">
        Built by <span className="text-indigo-400 font-medium">Bruce Bera</span> — beratech API v3.0
      </div>
    </div>
  );
}
