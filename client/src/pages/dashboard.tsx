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
  Tv,
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

const CATEGORY_META: Record<string, { icon: typeof Download; label: string; color: string }> = {
  download: { icon: Download, label: "Downloaders", color: "text-blue-500" },
  search: { icon: Search, label: "Search & Movies", color: "text-emerald-500" },
  drama: { icon: Tv, label: "Drama & Series", color: "text-pink-500" },
  anime: { icon: Film, label: "Anime & Torrents", color: "text-violet-500" },
  tools: { icon: Wrench, label: "Tools", color: "text-amber-500" },
  developer: { icon: Code, label: "Developer Tools", color: "text-cyan-500" },
  ai: { icon: Bot, label: "AI Tools", color: "text-rose-500" },
  location: { icon: MapPin, label: "Location", color: "text-green-500" },
  utilities: { icon: Settings, label: "Utilities", color: "text-orange-500" },
  ephoto360: { icon: Sparkles, label: "EPhoto360 Effects", color: "text-purple-500" },
};

const EXAMPLE_URLS: Record<string, string> = {
  "/api/download/ytmp3": "/api/download/ytmp3?url=https://youtu.be/dQw4w9WgXcQ&quality=128kbps",
  "/api/download/ytmp4": "/api/download/ytmp4?url=https://youtu.be/dQw4w9WgXcQ&quality=720p",
  "/api/download/tiktok": "/api/download/tiktok?url=https://www.tiktok.com/@user/video/1234567890",
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
  "/api/search/movies": "/api/search/movies?query=batman&limit=5",
  "/api/drama/search": "/api/drama/search?query=goblin",
  "/api/drama/info": "/api/drama/info?id=93405",
  "/api/drama/season": "/api/drama/season?id=93405&season=1",
  "/api/drama/trending": "/api/drama/trending?region=KR",
  "/api/drama/discover": "/api/drama/discover?country=KR&sort_by=popularity.desc",
  "/api/drama/box/trending": "/api/drama/box/trending",
  "/api/drama/box/info": "/api/drama/box/info?id=42000004357&slug=watch-out-i-call-the-final-shots",
  "/api/drama/flixhq/search": "/api/drama/flixhq/search?query=squid+game",
  "/api/drama/flixhq/info": "/api/drama/flixhq/info?id=tv/watch-squid-game-72172",
  "/api/anime/search": "/api/anime/search?query=naruto",
  "/api/anime/spotlight": "/api/anime/spotlight",
  "/api/anime/airing": "/api/anime/airing?page=1",
  "/api/anime/popular": "/api/anime/popular?page=1",
  "/api/anime/recent": "/api/anime/recent?page=1",
  "/api/anime/anilist/search": "/api/anime/anilist/search?query=attack+on+titan",
  "/api/anime/anilist/trending": "/api/anime/anilist/trending?limit=10",
  "/api/anime/anilist/info": "/api/anime/anilist/info?id=16498",
  "/api/torrent/nyaa": "/api/torrent/nyaa?query=one+piece&category=anime-eng&filter=trusted-only",
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
  "/api/download/tiktok": [
    { key: "url", placeholder: "TikTok URL", required: true },
  ],
  "/api/search/yts": [
    { key: "query", placeholder: "Search term (e.g. Rick Astley)", required: true },
    { key: "limit", placeholder: "Limit (default: 10)", required: false },
  ],
  "/api/search/lyrics": [
    { key: "query", placeholder: "Song name (e.g. Shape of You)", required: true },
  ],
  "/api/search/wiki": [
    { key: "query", placeholder: "Search term (e.g. Linux)", required: true },
  ],
  "/api/tools/translate": [
    { key: "text", placeholder: "Text to translate", required: true },
    { key: "to", placeholder: "Target language code (e.g. es, fr)", required: true },
    { key: "from", placeholder: "Source language (default: en)", required: false },
  ],
  "/api/tools/github": [
    { key: "username", placeholder: "GitHub username (e.g. torvalds)", required: true },
  ],
  "/api/tools/quote": [],
  "/api/tools/screenshot": [
    { key: "url", placeholder: "Website URL (e.g. https://google.com)", required: true },
  ],
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
    { key: "code", placeholder: "Code to debug (e.g. for(let i=0;i<10;i++)console.log(i)", required: true },
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
  "/api/location/geoip": [
    { key: "ip", placeholder: "IP address (leave empty for your IP)", required: false },
  ],
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
  "/api/utils/weather": [
    { key: "location", placeholder: "City or location (e.g. London, New York)", required: true },
  ],
  "/api/utils/crypto": [
    { key: "coin", placeholder: "Coin name or symbol (e.g. bitcoin, eth)", required: true },
    { key: "currency", placeholder: "Currency: usd, eur, gbp (default usd)", required: false },
  ],
  "/api/utils/currency": [
    { key: "from", placeholder: "From currency (e.g. USD)", required: true },
    { key: "to", placeholder: "To currency (e.g. EUR)", required: true },
    { key: "amount", placeholder: "Amount (default 1)", required: false },
  ],
  "/api/utils/shorten": [
    { key: "url", placeholder: "URL to shorten (e.g. https://example.com/long-path)", required: true },
  ],
  "/api/utils/whois": [
    { key: "domain", placeholder: "Domain name (e.g. google.com)", required: true },
  ],
  "/api/utils/phone": [
    { key: "phone", placeholder: "Phone number (e.g. +14155552671)", required: true },
    { key: "country_code", placeholder: "Country code (optional, e.g. US)", required: false },
  ],
  "/api/utils/news": [
    { key: "source", placeholder: "Source: hackernews (default)", required: false },
    { key: "limit", placeholder: "Number of articles (default 10, max 30)", required: false },
  ],
  "/api/utils/gitignore": [
    { key: "templates", placeholder: "Templates (e.g. node,python,vscode)", required: true },
  ],
  "/api/utils/metadata": [
    { key: "url", placeholder: "Website URL to scrape metadata from", required: true },
  ],
  "/api/utils/uptime": [
    { key: "url", placeholder: "URL to check (e.g. https://google.com)", required: true },
  ],
  "/api/search/movies": [
    { key: "query", placeholder: "Movie title (e.g. batman, inception)", required: true },
    { key: "limit", placeholder: "Results limit (default: 20, max: 50)", required: false },
  ],
  "/api/drama/search": [
    { key: "query", placeholder: "Drama/series name (e.g. goblin, squid game)", required: true },
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/drama/info": [
    { key: "id", placeholder: "TMDb TV ID (e.g. 93405 for Squid Game)", required: true },
  ],
  "/api/drama/season": [
    { key: "id", placeholder: "TMDb TV ID (e.g. 93405)", required: true },
    { key: "season", placeholder: "Season number (e.g. 1)", required: true },
  ],
  "/api/drama/trending": [
    { key: "region", placeholder: "Country code: KR, JP, CN, TH, US (default: KR)", required: false },
  ],
  "/api/drama/discover": [
    { key: "country", placeholder: "Country code: KR, JP, CN, TH, US", required: false },
    { key: "genre", placeholder: "TMDb genre ID (e.g. 18=Drama, 10759=Action)", required: false },
    { key: "sort_by", placeholder: "Sort: popularity.desc, vote_average.desc", required: false },
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/drama/box/trending": [],
  "/api/drama/box/info": [
    { key: "id", placeholder: "DramaBox ID (e.g. 42000004357)", required: true },
    { key: "slug", placeholder: "Drama slug (e.g. watch-out-i-call-the-final-shots)", required: true },
  ],
  "/api/drama/flixhq/search": [
    { key: "query", placeholder: "Movie/series name (e.g. squid game)", required: true },
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/drama/flixhq/info": [
    { key: "id", placeholder: "FlixHQ media ID (e.g. tv/watch-squid-game-72172)", required: true },
  ],
  "/api/anime/search": [
    { key: "query", placeholder: "Anime name (e.g. naruto, one piece)", required: true },
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/anime/spotlight": [],
  "/api/anime/airing": [
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/anime/popular": [
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/anime/recent": [
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/anime/anilist/search": [
    { key: "query", placeholder: "Anime title (e.g. attack on titan)", required: true },
    { key: "limit", placeholder: "Results per page (default: 20, max: 50)", required: false },
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/anime/anilist/trending": [
    { key: "limit", placeholder: "Results (default: 20, max: 50)", required: false },
    { key: "page", placeholder: "Page number (default: 1)", required: false },
  ],
  "/api/anime/anilist/info": [
    { key: "id", placeholder: "AniList ID (e.g. 16498 for AoT)", required: true },
  ],
  "/api/torrent/nyaa": [
    { key: "query", placeholder: "Anime title (e.g. one piece, demon slayer)", required: true },
    { key: "category", placeholder: "Category: anime-eng, anime-raw, all (default: anime-eng)", required: false },
    { key: "filter", placeholder: "Filter: all, no-remakes, trusted-only (default: no-remakes)", required: false },
    { key: "limit", placeholder: "Limit (default: 20, max: 50)", required: false },
  ],
};

function getEndpointParams(ep: EndpointInfo): Array<{ key: string; placeholder: string; required: boolean }> {
  if (STATIC_PARAMS[ep.path]) return STATIC_PARAMS[ep.path];

  if (ep.path.startsWith("/api/ephoto360/")) {
    const inputs = ep.text_inputs || 1;
    if (inputs === 1) {
      return [{ key: "text", placeholder: "Your text", required: true }];
    } else if (inputs === 2) {
      return [
        { key: "text1", placeholder: "First text", required: true },
        { key: "text2", placeholder: "Second text", required: true },
      ];
    } else {
      return [
        { key: "text1", placeholder: "First text", required: true },
        { key: "text2", placeholder: "Second text", required: true },
        { key: "text3", placeholder: "Third text", required: true },
      ];
    }
  }

  return [];
}

function getExampleUrl(ep: EndpointInfo): string {
  if (EXAMPLE_URLS[ep.path]) return EXAMPLE_URLS[ep.path];
  if (ep.path.startsWith("/api/ephoto360/") && ep.path !== "/api/ephoto360/list") {
    const slug = ep.path.split("/").pop();
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
    <Card className="overflow-visible" data-testid={`endpoint-card-${ep.path.replace(/\//g, "-").slice(1)}`}>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 font-mono text-xs">
              {ep.method}
            </Badge>
            <span className="text-sm font-medium text-foreground">{ep.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {ep.text_inputs && (
              <Badge variant="secondary" className="text-xs">
                {ep.text_inputs === 1 ? "1 text" : `${ep.text_inputs} texts`}
              </Badge>
            )}
            <Button
              variant={testing ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTesting(!testing);
                if (testing) { setResult(null); setParams({}); }
              }}
              data-testid={`button-test-${ep.path.replace(/\//g, "-").slice(1)}`}
            >
              {testing ? (
                <><X className="w-3 h-3" /> Close</>
              ) : (
                <><Play className="w-3 h-3" /> Test</>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-muted/50 dark:bg-muted/30 rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground overflow-x-auto whitespace-nowrap" data-testid={`text-endpoint-url-${ep.path.replace(/\//g, "-").slice(1)}`}>
            {fullExampleUrl}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyEndpoint}
            data-testid={`button-copy-url-${ep.path.replace(/\//g, "-").slice(1)}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {testing && (
        <div className="px-3 pb-3 space-y-3 border-t pt-3 animate-scale-in">
          {endpointParams.length > 0 ? (
            <div className="space-y-2">
              {endpointParams.map((p) => (
                <div key={p.key} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 shrink-0 w-20">
                    <code className="text-xs font-mono text-muted-foreground">{p.key}</code>
                    {p.required && <span className="text-destructive text-xs">*</span>}
                  </div>
                  <Input
                    className="text-sm"
                    placeholder={p.placeholder}
                    value={params[p.key] || ""}
                    onChange={(e) => setParams({ ...params, [p.key]: e.target.value })}
                    data-testid={`input-param-${p.key}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No parameters required</p>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={runTest}
              disabled={loading}
              data-testid={`button-run-test-${ep.path.replace(/\//g, "-").slice(1)}`}
            >
              {loading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</>
              ) : (
                <><Play className="w-3 h-3" /> Send Request</>
              )}
            </Button>
            {result && (
              <Button variant="outline" size="sm" onClick={copyResult}>
                <Copy className="w-3 h-3" /> Copy
              </Button>
            )}
          </div>

          {result && (
            <pre className="text-xs bg-muted/60 p-3 rounded-md font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap break-all" data-testid="text-test-result">
              {result}
            </pre>
          )}
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const stats = data?.result;
  const memPercent = stats ? Math.round((stats.memory.used_bytes / stats.memory.total_bytes) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
            Bera API Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            API v3.0 — Status & Endpoint Testing
          </p>
        </div>
        <Badge
          variant="default"
          className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          data-testid="badge-status"
        >
          <Activity className="w-3 h-3 mr-1 animate-shimmer-pulse" />
          Online
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Server Runtime
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-28 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-base font-bold text-foreground" data-testid="text-uptime">
              {stats?.uptime || "—"}
            </p>
          )}
        </Card>

        <Card className="p-4 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              RAM Usage
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-28 bg-muted animate-pulse rounded" />
          ) : (
            <div>
              <p className="text-base font-bold text-foreground" data-testid="text-memory">
                {stats?.memory?.used || "—"} / {stats?.memory?.total || "—"}
              </p>
              <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${memPercent}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Requests
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-base font-bold text-foreground" data-testid="text-requests">
              {stats?.total_requests?.toLocaleString() || "0"}
            </p>
          )}
        </Card>

        <Card className="p-4 animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Response Rate
            </span>
          </div>
          {isLoading ? (
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-base font-bold text-foreground" data-testid="text-response-rate">
              {stats?.response_rate || "—"}
            </p>
          )}
        </Card>
      </div>

      <Card className="p-4 animate-fade-in-up stagger-5">
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-foreground">System Health</span>
          <Badge
            variant="default"
            className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            All Endpoints Operational
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Api Status: <span className="text-emerald-500 font-medium">Online</span> — Response Rate: {stats?.response_rate || "—"} — Last Refreshed: 5 seconds ago
        </p>
      </Card>

      {stats?.endpoints && Object.entries(stats.endpoints).map(([category, endpoints], catIdx) => {
        const meta = CATEGORY_META[category] || { icon: ChevronRight, label: category, color: "text-foreground" };
        const Icon = meta.icon;

        return (
          <div key={category} className="space-y-2 animate-fade-in-up" style={{ animationDelay: `${0.3 + catIdx * 0.1}s` }}>
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${meta.color}`} />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {meta.label}
              </h2>
              <Badge variant="secondary" className="text-xs">{endpoints.length}</Badge>
            </div>
            <div className="space-y-2">
              {endpoints.map((ep: EndpointInfo, epIdx: number) => (
                <div key={ep.path} className="animate-fade-in" style={{ animationDelay: `${0.35 + catIdx * 0.1 + epIdx * 0.03}s` }}>
                  <EndpointTestCard ep={ep} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      )}
    </div>
  );
}
