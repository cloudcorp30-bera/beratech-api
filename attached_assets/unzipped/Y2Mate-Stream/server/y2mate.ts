import axios from "axios";

const _gB = Buffer.from("ZXRhY2xvdWQub3Jn", "base64").toString();
const _sU = Buffer.from("aHR0cHM6Ly92MS55Mm1hdGUubnU=", "base64").toString();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function extractVideoId(url: string): string | null {
  let match: RegExpExecArray | null = null;
  if (url.includes("youtu.be")) {
    match = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
  } else if (url.includes("youtube.com")) {
    if (url.includes("/live/") || url.includes("/shorts/")) {
      match = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
    } else {
      match = /v=([a-zA-Z0-9\-_]{11})/.exec(url);
    }
  }
  return match ? match[1] : null;
}

function getHeaders(accept: string = "application/json") {
  return {
    "User-Agent": USER_AGENT,
    Accept: accept,
    Referer: `${_sU}/`,
    Origin: _sU,
  };
}

async function fetchPageData(): Promise<{
  json: any[];
  authorization: string;
}> {
  const response = await axios.get(_sU, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: `${_sU}/`,
    },
    timeout: 15000,
  });

  const html = response.data as string;
  const jsonMatch = /var json\s*=\s*JSON\.parse\('(.+?)'\)/.exec(html);
  if (!jsonMatch) {
    throw new Error("Failed to extract configuration from page");
  }

  const json = JSON.parse(jsonMatch[1]);

  let auth = "";
  for (let i = 0; i < json[0].length; i++) {
    auth += String.fromCharCode(
      json[0][i] - json[2][json[2].length - (i + 1)],
    );
  }
  if (json[1]) {
    auth = auth.split("").reverse().join("");
  }
  if (auth.length > 32) {
    auth = auth.substring(0, 32);
  }

  return { json, authorization: auth };
}

async function initializeConversion(
  videoId: string,
  format: string,
  authorization: string,
  json: any[],
): Promise<string> {
  const paramKey = String.fromCharCode(json[6]);
  const url = `https://eta.${_gB}/api/v1/init?${paramKey}=${encodeURIComponent(authorization)}&t=${getTimestamp()}`;

  const response = await axios.get(url, {
    headers: getHeaders(),
    timeout: 30000,
  });

  const data = response.data;
  if (data.error && data.error > 0) {
    throw new Error(`Initialization error: code ${data.error}`);
  }

  if (!data.convertURL) {
    throw new Error("No conversion URL returned");
  }

  return data.convertURL;
}

async function startConversion(
  convertURL: string,
  videoId: string,
  format: string,
): Promise<{
  progressURL?: string;
  downloadURL?: string;
  title?: string;
  redirect?: boolean;
  redirectURL?: string;
  directDownload?: boolean;
}> {
  let url = convertURL;
  if (url.includes("&v=")) {
    url = url.split("&v=")[0];
  }
  url = `${url}&v=${videoId}&f=${format}&t=${getTimestamp()}`;

  const response = await axios.get(url, {
    headers: getHeaders(),
    timeout: 30000,
  });

  const data = response.data;
  if (data.error && data.error > 0) {
    throw new Error(`Conversion error: code ${data.error}`);
  }

  return {
    progressURL: data.progressURL,
    downloadURL: data.downloadURL,
    title: data.title,
    redirect: data.redirect === 1,
    redirectURL: data.redirectURL,
    directDownload: !!data.downloadURL && !data.progressURL,
  };
}

async function pollProgress(
  progressURL: string,
  downloadURL: string,
  videoId: string,
  format: string,
  maxRetries: number = 60,
): Promise<{ title: string; downloadURL: string }> {
  let title = "";
  let retries = 0;

  while (retries < maxRetries) {
    const url = `${progressURL}&t=${getTimestamp()}`;
    const response = await axios.get(url, {
      headers: getHeaders(),
      timeout: 30000,
    });

    const data = response.data;

    if (data.error && data.error > 0) {
      throw new Error(`Progress error: code ${data.error}`);
    }

    if (data.title && data.title.length > 0) {
      title = data.title;
    }

    if (data.progress >= 3) {
      return { title, downloadURL: downloadURL };
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Conversion timed out");
}

function buildFinalDownloadURL(
  downloadURL: string,
  videoId: string,
  format: string,
): string {
  return `${downloadURL}&s=3&v=${videoId}&f=${format}`;
}

function getThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const res = await axios.get(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { timeout: 8000 },
    );
    return res.data?.title || "";
  } catch {
    return "";
  }
}

export async function convert(
  videoUrl: string,
  format: "mp3" | "mp4",
): Promise<{
  title: string;
  quality: string;
  thumbnail: string;
  download_url: string;
}> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const { json, authorization } = await fetchPageData();

  const convertURL = await initializeConversion(
    videoId,
    format,
    authorization,
    json,
  );

  const convResult = await startConversion(convertURL, videoId, format);

  let title = convResult.title || "";
  let finalDownloadURL = "";

  if (convResult.redirect && convResult.redirectURL) {
    const redirectResult = await startConversion(
      convResult.redirectURL,
      videoId,
      format,
    );

    if (
      redirectResult.directDownload ||
      (json[3] === 1 && redirectResult.downloadURL)
    ) {
      title = redirectResult.title || title;
      finalDownloadURL = buildFinalDownloadURL(
        redirectResult.downloadURL!,
        videoId,
        format,
      );
    } else if (redirectResult.progressURL && redirectResult.downloadURL) {
      const progressResult = await pollProgress(
        redirectResult.progressURL,
        redirectResult.downloadURL,
        videoId,
        format,
      );
      title = progressResult.title || title;
      finalDownloadURL = buildFinalDownloadURL(
        progressResult.downloadURL,
        videoId,
        format,
      );
    }
  } else if (
    convResult.directDownload ||
    (json[3] === 1 && convResult.downloadURL)
  ) {
    finalDownloadURL = buildFinalDownloadURL(
      convResult.downloadURL!,
      videoId,
      format,
    );
  } else if (convResult.progressURL && convResult.downloadURL) {
    const progressResult = await pollProgress(
      convResult.progressURL,
      convResult.downloadURL,
      videoId,
      format,
    );
    title = progressResult.title || title;
    finalDownloadURL = buildFinalDownloadURL(
      progressResult.downloadURL,
      videoId,
      format,
    );
  } else {
    throw new Error("Unexpected conversion response");
  }

  if (!finalDownloadURL) {
    throw new Error("Failed to get download URL");
  }

  if (!title || title === `Video ${videoId}`) {
    title = await fetchYouTubeTitle(videoId);
  }

  const quality = format === "mp3" ? "192kbps" : "360p";

  return {
    title: title || `Video ${videoId}`,
    quality,
    thumbnail: getThumbnail(videoId),
    download_url: finalDownloadURL,
  };
}
