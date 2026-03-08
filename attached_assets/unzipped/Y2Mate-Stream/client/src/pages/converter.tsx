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
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { SiTiktok } from "react-icons/si";

type Platform = "youtube" | "tiktok";

interface YoutubeResult {
  status: number;
  success: boolean;
  creator: string;
  result: {
    youtube_id: string;
    quality: string;
    title: string;
    thumbnail: string;
    message: string;
    download_url: string;
  };
}

interface TikTokResult {
  status: number;
  success: boolean;
  creator: string;
  result: {
    id: string;
    title: string;
    duration: number;
    cover: string;
    video: string;
    music: string;
    author: { id: string; name: string; avatar: string };
  };
}

export default function Converter() {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [quality, setQuality] = useState("128kbps");
  const { toast } = useToast();

  const ytMutation = useMutation({
    mutationFn: async () => {
      const endpoint = format === "mp3" ? "ytmp3" : "ytmp4";
      const params = new URLSearchParams({ url, quality });
      const res = await fetch(`/api/download/${endpoint}?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Conversion failed");
      }
      return res.json() as Promise<YoutubeResult>;
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const ttMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ url });
      const res = await fetch(`/api/download/tiktok?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Download failed");
      }
      return res.json() as Promise<TikTokResult>;
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const isPending = ytMutation.isPending || ttMutation.isPending;
  const ytResult = ytMutation.data;
  const ttResult = ttMutation.data;

  const handleConvert = () => {
    if (platform === "youtube") {
      ytMutation.mutate();
    } else {
      ttMutation.mutate();
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied to clipboard" });
  };

  const mp3Qualities = ["128kbps", "192kbps", "256kbps", "320kbps"];
  const mp4Qualities = ["360p", "480p", "720p", "1080p"];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-converter-title">
          Converter
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download videos from YouTube and TikTok
        </p>
      </div>

      <div className="flex gap-2 animate-fade-in-up stagger-1">
        <Button
          variant={platform === "youtube" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setPlatform("youtube");
            setFormat("mp3");
            setQuality("128kbps");
          }}
          data-testid="button-platform-youtube"
        >
          <Video className="w-3.5 h-3.5" />
          YouTube
        </Button>
        <Button
          variant={platform === "tiktok" ? "default" : "outline"}
          size="sm"
          onClick={() => setPlatform("tiktok")}
          data-testid="button-platform-tiktok"
        >
          <SiTiktok className="w-3.5 h-3.5" />
          TikTok
        </Button>
      </div>

      <Card className="p-5 sm:p-6 animate-fade-in-up stagger-2">
        <div className="space-y-4">
          <div className="relative">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-url"
              type="url"
              placeholder={
                platform === "youtube"
                  ? "Paste YouTube URL here..."
                  : "Paste TikTok URL here..."
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 text-base"
            />
          </div>

          {platform === "youtube" && (
            <div className="flex gap-3 flex-wrap">
              <Select
                value={format}
                onValueChange={(v) => {
                  const f = v as "mp3" | "mp4";
                  setFormat(f);
                  setQuality(f === "mp3" ? "128kbps" : "360p");
                }}
              >
                <SelectTrigger className="w-[120px]" data-testid="select-format">
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

              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="w-[120px]" data-testid="select-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(format === "mp3" ? mp3Qualities : mp4Qualities).map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                data-testid="button-convert"
                className="flex-1 min-w-[120px]"
                onClick={handleConvert}
                disabled={!url.trim() || isPending}
              >
                {isPending ? (
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
          )}

          {platform === "tiktok" && (
            <Button
              data-testid="button-download-tiktok"
              className="w-full"
              onClick={handleConvert}
              disabled={!url.trim() || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download TikTok Video
                </>
              )}
            </Button>
          )}
        </div>

        {isPending && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Processing...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a moment
                </p>
              </div>
            </div>
          </div>
        )}

        {(ytMutation.isError || ttMutation.isError) && !isPending && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start gap-3 p-4 rounded-md bg-destructive/5 border border-destructive/15">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive" data-testid="text-error">
                  Download failed
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please check the URL and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {ytResult?.success && !isPending && (
          <div className="mt-6 pt-6 border-t animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">Ready to download</span>
            </div>
            <div className="flex gap-4 items-start">
              <img
                data-testid="img-thumbnail"
                src={ytResult.result.thumbnail}
                alt={ytResult.result.title}
                className="w-28 sm:w-36 rounded-md object-cover aspect-video shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-semibold text-foreground line-clamp-2"
                  data-testid="text-video-title"
                >
                  {ytResult.result.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {format.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {ytResult.result.quality}
                  </span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button data-testid="button-download" size="sm" asChild>
                    <a href={ytResult.result.download_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </Button>
                  <Button
                    data-testid="button-copy-link"
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(ytResult.result.download_url)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {ttResult?.success && !isPending && (
          <div className="mt-6 pt-6 border-t animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">Ready to download</span>
            </div>
            <div className="flex gap-4 items-start">
              <img
                data-testid="img-tiktok-cover"
                src={ttResult.result.cover}
                alt={ttResult.result.title}
                className="w-24 sm:w-32 rounded-md object-cover aspect-[9/16] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-semibold text-foreground line-clamp-3"
                  data-testid="text-tiktok-title"
                >
                  {ttResult.result.title || "TikTok Video"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  by {ttResult.result.author.name}
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button data-testid="button-download-video" size="sm" asChild>
                    <a href={ttResult.result.video} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5" />
                      Video
                    </a>
                  </Button>
                  {ttResult.result.music && (
                    <Button data-testid="button-download-audio" variant="outline" size="sm" asChild>
                      <a href={ttResult.result.music} target="_blank" rel="noopener noreferrer">
                        <Music className="w-3.5 h-3.5" />
                        Audio
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(ttResult.result.video)}
                    data-testid="button-copy-tiktok"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
