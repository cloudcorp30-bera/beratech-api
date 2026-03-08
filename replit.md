# Bera API

## Overview
A comprehensive multi-category API service with a polished web frontend. Includes YouTube/TikTok download, search capabilities, developer tools, AI-powered tools, utility tools, and photo effects. Features a GiftedTech-inspired dashboard with real-time server statistics, categorized endpoint cards, and inline API testing.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components (teal/cyan theme)
- **Backend**: Express.js with scraping modules, external API integrations
- **No database required** - stateless API service
- **Color scheme**: Teal/cyan primary (hsl 173 80% 40%)
- **Image hosting**: All photo-based endpoints (screenshot, QR code, ephoto360) upload to catbox.moe for permanent URLs

## Key Files
- `server/routes.ts` - All API endpoint registrations
- `server/y2mate.ts` - YouTube download scraping logic (y2mate.nu)
- `server/ytsearch.ts` - YouTube search scraper
- `server/lyrics.ts` - Song lyrics via Deezer API + lyrics.ovh
- `server/tools.ts` - Utility endpoints (translate, github, quote, screenshot)
- `server/devtools.ts` - Developer tool endpoints (hash, base64, uuid, qr, dns, ip, etc.) + tools directory
- `server/ai.ts` - AI-powered endpoints (chat, summarize, codegen, translate, analyze, imagine, explain, debug, review, commit, unittest, sql, regex, docstring, refactor, complexity, tts, voicetranslate)
- `server/location.ts` - Location endpoints (geolocation, reverse geocode, timezone, device info, uptime, weather)
- `server/utilities.ts` - Utility endpoints (crypto, currency, URL shortener, WHOIS, phone, news, gitignore, metadata)
- `server/catbox.ts` - Shared catbox.moe upload utility for permanent image/audio hosting
- `server/ephoto.ts` - EPhoto360 text effects (en.ephoto360.com)
- `client/src/pages/dashboard.tsx` - Main dashboard with stats + endpoint testing
- `client/src/pages/docs.tsx` - API documentation with inline testing
- `client/src/pages/tools.tsx` - Interactive tools page (translate, github, quote, screenshot)
- `client/src/pages/photo.tsx` - Photo effects generator page
- `client/src/pages/converter.tsx` - YouTube converter UI
- `client/src/pages/search.tsx` - YouTube search UI
- `client/src/components/app-sidebar.tsx` - Sidebar navigation
- `shared/schema.ts` - Zod schemas and TypeScript types

## API Endpoints

### Download
- `GET /api/download/ytmp3?url={youtube_url}&quality=128kbps` - YouTube to MP3
- `GET /api/download/ytmp4?url={youtube_url}&quality=360p` - YouTube to MP4
- `GET /api/download/tiktok?url={tiktok_url}` - TikTok video download
- `GET /dl/cnv/{format}/{id}` - Proxied download (10-min expiry)

### Search
- `GET /api/search/yts?query={term}&limit=10` - YouTube search
- `GET /api/search/lyrics?query={song}` - Song lyrics (Deezer + lyrics.ovh)
- `GET /api/search/wiki?query={term}` - Wikipedia search

### Tools
- `GET /api/tools/translate?text={text}&to={lang_code}` - Text translation
- `GET /api/tools/github?username={user}` - GitHub user lookup
- `GET /api/tools/quote` - Random inspirational quote
- `GET /api/tools/screenshot?url={website_url}` - Website screenshot (catbox hosted)

### Developer Tools (38 endpoints)
- `GET /api/dev/hash?text={text}&algorithm=all` - MD5/SHA1/SHA256/SHA512 hashes
- `GET /api/dev/base64/encode?text={text}` - Base64 encode
- `GET /api/dev/base64/decode?text={encoded}` - Base64 decode
- `GET /api/dev/uuid?count=1` - Generate UUIDs
- `GET /api/dev/password?length=16` - Secure password generator
- `GET /api/dev/timestamp?input={unix_or_date}` - Timestamp/date converter
- `GET /api/dev/color?color={hex_or_rgb}` - Color converter (hex/rgb/hsl/cmyk)
- `GET /api/dev/jwt?token={jwt}` - JWT decoder
- `GET /api/dev/jwt/generate?payload={json}&secret={key}&expiresIn=3600` - JWT token generator
- `GET /api/dev/ip?ip={address}` - IP geolocation lookup
- `GET /api/dev/dns?domain={domain}` - DNS records (A/AAAA/MX/TXT/NS/CNAME)
- `GET /api/dev/headers?url={url}` - HTTP headers checker
- `GET /api/dev/qrcode?text={text}&size=300` - QR code generator (catbox hosted)
- `GET /api/dev/regex?pattern={regex}&flags=g&text={string}` - Regex tester
- `GET /api/dev/lorem?count=3&type=paragraphs` - Lorem ipsum generator
- `GET /api/dev/urlparse?url={url}` - URL parser
- `GET /api/dev/urlencode?text={text}&action=encode` - URL encode/decode
- `GET /api/dev/hmac?text={msg}&secret={key}&algorithm=sha256` - HMAC generator
- `GET /api/dev/useragent?ua={string}` - User agent parser
- `GET /api/dev/baseconvert?value=255&from=10&to=16` - Number base converter
- `GET /api/dev/textstats?text={text}` - Text statistics analyzer
- `GET /api/dev/json?json={json_string}` - JSON validator & formatter
- `GET /api/dev/slug?text={text}&separator=-` - URL slug generator
- `GET /api/dev/httpstatus?code=404` - HTTP status code reference
- `GET /api/dev/case?text={text}&to=camel` - String case converter (camel/pascal/snake/kebab/constant/dot/title)
- `GET /api/dev/ipvalidate?ip={address}` - IP address validator & classifier
- `GET /api/dev/bytes?value=1024&from=KB&to=MB` - Byte/unit converter (B/KB/MB/GB/TB/PB)
- `GET /api/dev/email?email={address}` - Email validator with MX record check
- `GET /api/dev/htmlentities?text={html}&action=encode` - HTML entities encode/decode
- `GET /api/dev/morse?text={text}&action=encode` - Morse code encoder/decoder
- `GET /api/dev/randomdata?count=1` - Random fake user data generator
- `GET /api/dev/diff?text1={text}&text2={text}` - Text diff comparison
- `GET /api/dev/cron?expression=*/5 * * * *` - Cron expression parser
- `GET /api/dev/ssl?domain={domain}` - SSL certificate checker
- `GET /api/dev/markdown?text={markdown}` - Markdown to HTML converter
- `GET /api/dev/csv2json?csv={csv_data}&delimiter=,` - CSV to JSON converter
- `GET /api/dev/cidr?cidr=192.168.1.0/24` - CIDR subnet calculator
- `GET /api/dev/directory?category={category}` - Developer tools directory (80+ tools, 14 categories)

### AI (18 endpoints)
- `GET /api/ai/chat?prompt={text}&system={prompt}` - AI chat completion
- `GET /api/ai/summarize?text={text}&maxLength={num}` - AI text summarization
- `GET /api/ai/codegen?prompt={text}&language={lang}` - AI code generation
- `GET /api/ai/translate?text={text}&to={lang}&from={lang}` - AI-powered translation
- `GET /api/ai/analyze?text={text}&type={type}` - AI text analysis (sentiment, grammar, keywords)
- `GET /api/ai/imagine?prompt={text}&size={size}` - AI image generation (catbox hosted)
- `GET /api/ai/explain?code={code}&language={lang}` - AI code explainer
- `GET /api/ai/debug?code={code}&error={msg}&language={lang}` - AI code debugger
- `GET /api/ai/review?code={code}&language={lang}` - AI code review
- `GET /api/ai/commit?diff={text}&style={style}` - AI git commit message generator
- `GET /api/ai/unittest?code={code}&language={lang}&framework={fw}` - AI unit test generator
- `GET /api/ai/sql?prompt={text}&dialect={dialect}&schema={schema}` - AI natural language to SQL
- `GET /api/ai/regex?description={text}&flavor={flavor}` - AI natural language to regex
- `GET /api/ai/docstring?code={code}&language={lang}&style={style}` - AI documentation generator
- `GET /api/ai/refactor?code={code}&language={lang}&goal={goal}` - AI code refactoring
- `GET /api/ai/complexity?code={code}&language={lang}` - AI code complexity analyzer
- `GET /api/ai/tts?text={text}&voice={voice}&speed={speed}` - AI text-to-speech (catbox hosted)
- `GET /api/ai/voicetranslate?text={text}&to={lang}&voice={voice}` - AI voice translation (catbox hosted)

### Location (4 endpoints)
- `GET /api/location/geoip?ip={address}` - IP geolocation lookup
- `GET /api/location/reverse?lat={lat}&lon={lon}` - Reverse geocode coordinates
- `GET /api/location/timezone?lat={lat}&lon={lon}` - Timezone from coordinates
- `GET /api/location/device?ua={string}&ip={address}` - Device & browser info

### Utilities (10 endpoints)
- `GET /api/utils/weather?location={city}` - Weather lookup
- `GET /api/utils/crypto?coin={name}&currency={cur}` - Cryptocurrency prices
- `GET /api/utils/currency?from={cur}&to={cur}&amount={num}` - Currency exchange rates
- `GET /api/utils/shorten?url={url}` - URL shortener
- `GET /api/utils/whois?domain={domain}` - WHOIS domain lookup
- `GET /api/utils/phone?phone={number}` - Phone number validator
- `GET /api/utils/news?source=hackernews&limit=10` - Tech news headlines
- `GET /api/utils/gitignore?templates={list}` - Gitignore generator
- `GET /api/utils/metadata?url={url}` - Website metadata scraper
- `GET /api/utils/uptime?url={url}` - Website uptime checker

### EPhoto360 (38 pure-text effects with permanent catbox-hosted URLs)
- `GET /api/ephoto360/list` - List all effects grouped by text inputs
- `GET /api/ephoto360/:effectSlug` - Individual effect endpoints
  - **Single text** (`?text=`): neon, naruto, neonLight, graffiti, dragonBall, 3dComic, glossySilver, colorfulNeon, wetGlass, 3dGradient, pixelGlitch, embroidery, watercolor, 3dBalloon, 3dColorPaint, matrix, cloudSky, goldPro, luxuryGold, 3dCrack, blackpink, 3dGradientLogo, wingsLogo
  - **Dual text** (`?text1=&text2=`): deadpool, bornPink, thor, tiktok, pornhub, avengers, wolfGalaxy, vintageLightBulb, graffitiWall, graffitiGirl, footballShirt, 3dWood, 3dStone, space3d
  - **Triple text** (`?text1=&text2=&text3=`): sciFiLogo
- Build servers migrated from s1.ephoto360.com to e1/e2.yotools.net (auto-detected from pages)

### System
- `GET /api/stats` - Server stats, endpoint list by category, health

## Pages
- `/` - Dashboard with status cards, endpoint categories, inline API testing
- `/converter` - YouTube MP3/MP4 converter
- `/search` - YouTube search
- `/tools` - Interactive tools (translate, github lookup, quotes, screenshots)
- `/photo` - Photo effects generator
- `/docs` - Full API documentation with inline testing

## Domain Obfuscation
All external API URLs are encoded using `Buffer.from(base64).toString()` to prevent domain exposure in source code.

## Running
- `npm run dev` starts the Express + Vite dev server on port 5000
