import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search as SearchIcon,
  Loader2,
  ExternalLink,
  Music,
  Eye,
  Clock,
  User,
  MicVocal,
} from "lucide-react";

type SearchMode = "youtube" | "lyrics";

interface VideoResult {
  type: string;
  videoId: string;
  url: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  seconds: number;
  timestamp: string;
  duration: { seconds: number; timestamp: string };
  ago: string;
  views: number;
  author: { name: string; url: string };
}

interface LyricsResult {
  artist: string;
  title: string;
  image: string;
  link: string;
  lyrics: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("youtube");
  const { toast } = useToast();

  const ytSearch = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ query, limit: "12" });
      const res = await fetch(`/api/search/yts?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      return data.results as VideoResult[];
    },
    onError: () => {
      toast({ title: "Search failed", variant: "destructive" });
    },
  });

  const lyricsSearch = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ query });
      const res = await fetch(`/api/search/lyrics?${params.toString()}`);
      if (!res.ok) throw new Error("Lyrics search failed");
      const data = await res.json();
      return data.result as LyricsResult;
    },
    onError: () => {
      toast({ title: "Lyrics search failed", variant: "destructive" });
    },
  });

  const isPending = ytSearch.isPending || lyricsSearch.isPending;

  const handleSearch = () => {
    if (!query.trim()) return;
    if (mode === "youtube") {
      ytSearch.mutate();
    } else {
      lyricsSearch.mutate();
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-search-title">
          Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search YouTube videos or find song lyrics
        </p>
      </div>

      <div className="flex gap-2 animate-fade-in-up stagger-1">
        <Button
          variant={mode === "youtube" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("youtube")}
          data-testid="button-mode-youtube"
        >
          <SearchIcon className="w-3.5 h-3.5" />
          YouTube
        </Button>
        <Button
          variant={mode === "lyrics" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("lyrics")}
          data-testid="button-mode-lyrics"
        >
          <MicVocal className="w-3.5 h-3.5" />
          Lyrics
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
            type="text"
            placeholder={
              mode === "youtube"
                ? "Search YouTube videos..."
                : "Search for song lyrics..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 text-base"
          />
        </div>
        <Button
          data-testid="button-search"
          onClick={handleSearch}
          disabled={!query.trim() || isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Search
            </>
          )}
        </Button>
      </div>

      {isPending && (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Searching...</p>
          </div>
        </div>
      )}

      {mode === "youtube" && ytSearch.data && !isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ytSearch.data
            .filter((r) => r.type === "video")
            .map((video, idx) => (
              <Card
                key={video.videoId}
                className="overflow-visible hover-elevate animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
                data-testid={`card-video-${video.videoId}`}
              >
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover rounded-t-md"
                    />
                    {video.timestamp !== "Live" && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-xs font-mono bg-black/80 text-white rounded">
                        {video.timestamp}
                      </span>
                    )}
                  </div>
                </a>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {video.author.name}
                    </span>
                    {video.views > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatViews(video.views)}
                      </span>
                    )}
                    {video.ago && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {video.ago}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {mode === "lyrics" && lyricsSearch.data && !isPending && (
        <Card className="p-5 sm:p-6 animate-fade-in-up">
          <div className="flex gap-4 items-start mb-6 flex-wrap">
            {lyricsSearch.data.image && (
              <img
                src={lyricsSearch.data.image}
                alt={lyricsSearch.data.title}
                className="w-24 h-24 rounded-md object-cover shrink-0"
                data-testid="img-lyrics-art"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2
                className="text-lg font-bold text-foreground"
                data-testid="text-lyrics-title"
              >
                {lyricsSearch.data.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {lyricsSearch.data.artist}
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a
                  href={lyricsSearch.data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-genius"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Genius
                </a>
              </Button>
            </div>
          </div>
          <div className="border-t pt-4">
            <pre
              className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed"
              data-testid="text-lyrics"
            >
              {lyricsSearch.data.lyrics}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
