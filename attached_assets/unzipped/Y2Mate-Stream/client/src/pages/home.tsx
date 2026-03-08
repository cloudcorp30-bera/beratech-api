import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Music,
  Video,
  Loader2,
  Link2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Zap,
  Shield,
  Clock,
  Play,
} from "lucide-react";
import type { ConvertResult } from "@shared/schema";

const TEST_URL = "https://youtu.be/qF-JLqKtr2Q?feature=shared";

function TestEndpoint() {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const params = new URLSearchParams({ url: TEST_URL, quality: "128kbps" });
      const res = await fetch(`/api/download/ytmp3?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTestError(data.error || "Test failed");
      } else {
        setTestResult(data);
      }
    } catch (err: any) {
      setTestError(err?.message || "Network error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-base font-semibold text-foreground">
          Test Endpoint
        </h2>
        <Button
          data-testid="button-run-test"
          size="sm"
          onClick={runTest}
          disabled={testing}
        >
          {testing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Run Test
            </>
          )}
        </Button>
      </div>
      <div className="mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Test URL
        </p>
        <pre className="text-xs bg-muted px-3 py-2.5 rounded-md font-mono overflow-x-auto break-all whitespace-pre-wrap">
{`/api/download/ytmp3?url=${encodeURIComponent(TEST_URL)}&quality=128kbps`}
        </pre>
      </div>

      {testing && (
        <div className="flex items-center gap-2 py-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Converting video, please wait...</span>
        </div>
      )}

      {testError && !testing && (
        <div className="flex items-start gap-3 p-3 rounded-md bg-destructive/5 border border-destructive/15">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive" data-testid="text-test-error">{testError}</p>
        </div>
      )}

      {testResult && !testing && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">Test passed</span>
          </div>
          <pre
            className="text-xs bg-muted px-3 py-2.5 rounded-md font-mono overflow-x-auto max-h-64 overflow-y-auto"
            data-testid="text-test-result"
          >
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async () => {
      const quality = format === "mp3" ? "128kbps" : "360p";
      const endpoint = format === "mp3" ? "ytmp3" : "ytmp4";
      const params = new URLSearchParams({ url, quality });
      const res = await fetch(`/api/download/${endpoint}?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Conversion failed");
      }
      return res.json() as Promise<ConvertResult>;
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const result = convertMutation.data;

  const copyLink = () => {
    if (result?.result?.download_url) {
      navigator.clipboard.writeText(result.result.download_url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-8 sm:pt-24 sm:pb-12">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Fast & Free Converter
            </div>
            <h1
              className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4"
              data-testid="text-title"
            >
              YouTube to{" "}
              <span className="text-primary">MP3</span> /{" "}
              <span className="text-primary">MP4</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Convert and download YouTube videos instantly. Paste a link, pick your format, and download.
            </p>
          </div>

          <Card className="p-5 sm:p-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-url"
                  type="url"
                  placeholder="Paste YouTube URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 text-base"
                />
              </div>

              <div className="flex gap-3">
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as "mp3" | "mp4")}
                >
                  <SelectTrigger
                    className="w-[140px]"
                    data-testid="select-format"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">
                      <span className="flex items-center gap-2">
                        <Music className="w-3.5 h-3.5" /> MP3
                      </span>
                    </SelectItem>
                    <SelectItem value="mp4">
                      <span className="flex items-center gap-2">
                        <Video className="w-3.5 h-3.5" /> MP4
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  data-testid="button-convert"
                  className="flex-1"
                  onClick={() => convertMutation.mutate()}
                  disabled={!url.trim() || convertMutation.isPending}
                >
                  {convertMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      Convert
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {convertMutation.isPending && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Processing your video...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a moment depending on the video length
                    </p>
                  </div>
                </div>
              </div>
            )}

            {convertMutation.isError && !convertMutation.isPending && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start gap-3 p-4 rounded-md bg-destructive/5 border border-destructive/15">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p
                      className="text-sm font-medium text-destructive"
                      data-testid="text-error"
                    >
                      Conversion failed
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please check the URL and try again. Make sure it's a valid YouTube video link.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result?.success && !convertMutation.isPending && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    Ready to download
                  </span>
                </div>
                <div className="flex gap-4 items-start">
                  <img
                    data-testid="img-thumbnail"
                    src={result.result.thumbnail}
                    alt={result.result.title}
                    className="w-28 sm:w-36 rounded-md object-cover aspect-video shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-semibold text-foreground line-clamp-2"
                      data-testid="text-video-title"
                    >
                      {result.result.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {format === "mp3" ? (
                          <Music className="w-3 h-3" />
                        ) : (
                          <Video className="w-3 h-3" />
                        )}
                        {format.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.result.quality}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button
                        data-testid="button-download"
                        size="sm"
                        asChild
                      >
                        <a
                          href={result.result.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </Button>
                      <Button
                        data-testid="button-copy-link"
                        variant="outline"
                        size="sm"
                        onClick={copyLink}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </Button>
                      <Button
                        data-testid="button-open-link"
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={result.result.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="mt-16 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Lightning Fast
                </h3>
                <p className="text-xs text-muted-foreground">
                  Real-time conversion with optimized processing
                </p>
              </div>
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Secure & Private
                </h3>
                <p className="text-xs text-muted-foreground">
                  No data stored. Your conversions are completely private
                </p>
              </div>
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Always Available
                </h3>
                <p className="text-xs text-muted-foreground">
                  24/7 access with no registration required
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-2xl mx-auto space-y-4">
            <Card className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">
                API Documentation
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    YouTube Search
                  </p>
                  <pre className="text-xs bg-muted px-3 py-2.5 rounded-md font-mono overflow-x-auto">
{`GET /api/search/yts?query={search_term}&limit=10`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    MP3 Download
                  </p>
                  <pre className="text-xs bg-muted px-3 py-2.5 rounded-md font-mono overflow-x-auto">
{`GET /api/download/ytmp3?url={youtube_url}&quality=128kbps`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    MP4 Download
                  </p>
                  <pre className="text-xs bg-muted px-3 py-2.5 rounded-md font-mono overflow-x-auto">
{`GET /api/download/ytmp4?url={youtube_url}&quality=360p`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Search Example
                  </p>
                  <pre className="text-xs bg-muted px-3 py-2.5 rounded-md font-mono overflow-x-auto break-all whitespace-pre-wrap">
{`https://bera-api.replit.app/api/search/yts?query=Rick+Astley&limit=5`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Search Response
                  </p>
                  <pre className="text-xs bg-muted px-3 py-2.5 rounded-md font-mono overflow-x-auto">
{`{
  "status": 200,
  "success": true,
  "creator": "beratech",
  "results": [
    {
      "type": "video",
      "videoId": "dQw4w9WgXcQ",
      "url": "https://youtube.com/watch?v=...",
      "title": "Rick Astley - Never Gonna...",
      "description": "The official video for...",
      "image": "https://i.ytimg.com/vi/...",
      "thumbnail": "https://i.ytimg.com/vi/...",
      "seconds": 214,
      "timestamp": "3:34",
      "duration": { "seconds": 214, "timestamp": "3:34" },
      "ago": "16 years ago",
      "views": 1743552410,
      "author": {
        "name": "Rick Astley",
        "url": "https://youtube.com/channel/..."
      }
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </Card>

            <TestEndpoint />
          </div>

          <footer className="mt-16 pb-8 text-center">
            <p className="text-xs text-muted-foreground">
              Built by beratech. For personal use only.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
