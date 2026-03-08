import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Languages,
  Github,
  Quote,
  Camera,
  Loader2,
  Copy,
  ExternalLink,
  MapPin,
  Building,
  Users,
  BookOpen,
  Calendar,
} from "lucide-react";

type Tool = "translate" | "github" | "quote" | "screenshot";

export default function ToolsPage() {
  const [tool, setTool] = useState<Tool>("translate");
  const { toast } = useToast();

  const [translateText, setTranslateText] = useState("");
  const [translateTo, setTranslateTo] = useState("es");
  const [githubUser, setGithubUser] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");

  const translateMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ text: translateText, to: translateTo });
      const res = await fetch(`/api/tools/translate?${params.toString()}`);
      if (!res.ok) throw new Error("Translation failed");
      return res.json();
    },
    onError: () => { toast({ title: "Translation failed", variant: "destructive" }); },
  });

  const githubMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tools/github?username=${encodeURIComponent(githubUser)}`);
      if (!res.ok) throw new Error("GitHub lookup failed");
      return res.json();
    },
    onError: () => { toast({ title: "GitHub lookup failed", variant: "destructive" }); },
  });

  const quoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tools/quote");
      if (!res.ok) throw new Error("Quote fetch failed");
      return res.json();
    },
    onError: () => { toast({ title: "Failed to fetch quote", variant: "destructive" }); },
  });

  const screenshotMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tools/screenshot?url=${encodeURIComponent(screenshotUrl)}`);
      if (!res.ok) throw new Error("Screenshot failed");
      return res.json();
    },
    onError: () => { toast({ title: "Screenshot failed", variant: "destructive" }); },
  });

  const isPending = translateMutation.isPending || githubMutation.isPending || quoteMutation.isPending || screenshotMutation.isPending;

  const tools: { id: Tool; icon: typeof Languages; label: string }[] = [
    { id: "translate", icon: Languages, label: "Translate" },
    { id: "github", icon: Github, label: "GitHub" },
    { id: "quote", icon: Quote, label: "Quote" },
    { id: "screenshot", icon: Camera, label: "Screenshot" },
  ];

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-tools-title">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">Utility tools and API endpoints</p>
      </div>

      <div className="flex gap-2 flex-wrap animate-fade-in-up stagger-1">
        {tools.map((t) => (
          <Button
            key={t.id}
            variant={tool === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTool(t.id)}
            data-testid={`button-tool-${t.id}`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      {tool === "translate" && (
        <Card className="p-5 space-y-4 animate-scale-in">
          <h2 className="text-sm font-semibold text-foreground">Text Translator</h2>
          <Input
            data-testid="input-translate-text"
            placeholder="Enter text to translate..."
            value={translateText}
            onChange={(e) => setTranslateText(e.target.value)}
            className="text-base"
          />
          <div className="flex gap-3 flex-wrap">
            <Input
              data-testid="input-translate-to"
              placeholder="Language code (es, fr, de, ja...)"
              value={translateTo}
              onChange={(e) => setTranslateTo(e.target.value)}
              className="w-48"
            />
            <Button
              data-testid="button-translate"
              onClick={() => translateMutation.mutate()}
              disabled={!translateText.trim() || isPending}
            >
              {translateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              Translate
            </Button>
          </div>
          {translateMutation.data?.result && (
            <Card className="p-4 bg-muted/30 animate-fade-in-up">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="space-y-2 flex-1 min-w-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Original ({translateMutation.data.result.from})</p>
                    <p className="text-sm text-foreground">{translateMutation.data.result.original}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Translated ({translateMutation.data.result.to})</p>
                    <p className="text-base font-semibold text-foreground" data-testid="text-translation">{translateMutation.data.result.translated}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyText(translateMutation.data.result.translated)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          )}
        </Card>
      )}

      {tool === "github" && (
        <Card className="p-5 space-y-4 animate-scale-in">
          <h2 className="text-sm font-semibold text-foreground">GitHub User Lookup</h2>
          <div className="flex gap-3">
            <Input
              data-testid="input-github-user"
              placeholder="Enter GitHub username..."
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value)}
              className="text-base flex-1"
              onKeyDown={(e) => e.key === "Enter" && githubMutation.mutate()}
            />
            <Button
              data-testid="button-github-lookup"
              onClick={() => githubMutation.mutate()}
              disabled={!githubUser.trim() || isPending}
            >
              {githubMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
              Lookup
            </Button>
          </div>
          {githubMutation.data?.result && (
            <Card className="p-4 bg-muted/30 animate-fade-in-up">
              <div className="flex gap-4 items-start flex-wrap">
                <img
                  src={githubMutation.data.result.avatar}
                  alt={githubMutation.data.result.login}
                  className="w-16 h-16 rounded-full shrink-0"
                  data-testid="img-github-avatar"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-base font-bold text-foreground" data-testid="text-github-name">
                    {githubMutation.data.result.name || githubMutation.data.result.login}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{githubMutation.data.result.login}</p>
                  {githubMutation.data.result.bio && (
                    <p className="text-sm text-foreground">{githubMutation.data.result.bio}</p>
                  )}
                  <div className="flex gap-3 flex-wrap text-xs text-muted-foreground mt-2">
                    {githubMutation.data.result.company && (
                      <span className="flex items-center gap-1"><Building className="w-3 h-3" />{githubMutation.data.result.company}</span>
                    )}
                    {githubMutation.data.result.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{githubMutation.data.result.location}</span>
                    )}
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{githubMutation.data.result.public_repos} repos</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{githubMutation.data.result.followers.toLocaleString()} followers</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href={githubMutation.data.result.profile_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" /> View Profile
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </Card>
      )}

      {tool === "quote" && (
        <Card className="p-5 space-y-4 animate-scale-in">
          <h2 className="text-sm font-semibold text-foreground">Random Quote Generator</h2>
          <Button
            data-testid="button-get-quote"
            onClick={() => quoteMutation.mutate()}
            disabled={isPending}
          >
            {quoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Quote className="w-4 h-4" />}
            Get Random Quote
          </Button>
          {quoteMutation.data?.result && (
            <Card className="p-5 bg-muted/30 animate-fade-in-up">
              <blockquote className="text-base text-foreground italic leading-relaxed" data-testid="text-quote">
                "{quoteMutation.data.result.quote}"
              </blockquote>
              <p className="text-sm text-muted-foreground mt-3 font-medium">— {quoteMutation.data.result.author}</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => copyText(`"${quoteMutation.data.result.quote}" — ${quoteMutation.data.result.author}`)}>
                <Copy className="w-3 h-3" /> Copy Quote
              </Button>
            </Card>
          )}
        </Card>
      )}

      {tool === "screenshot" && (
        <Card className="p-5 space-y-4 animate-scale-in">
          <h2 className="text-sm font-semibold text-foreground">Website Screenshot</h2>
          <div className="flex gap-3">
            <Input
              data-testid="input-screenshot-url"
              placeholder="Enter website URL (https://example.com)"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              className="text-base flex-1"
            />
            <Button
              data-testid="button-screenshot"
              onClick={() => screenshotMutation.mutate()}
              disabled={!screenshotUrl.trim() || isPending}
            >
              {screenshotMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Capture
            </Button>
          </div>
          {screenshotMutation.data?.result && (
            <Card className="p-4 bg-muted/30 space-y-3 animate-fade-in-up">
              <img
                src={screenshotMutation.data.result.screenshot_url}
                alt="Website screenshot"
                className="w-full rounded-md border"
                data-testid="img-screenshot"
              />
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <a href={screenshotMutation.data.result.screenshot_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" /> Open Full Size
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => copyText(screenshotMutation.data.result.screenshot_url)}>
                  <Copy className="w-3 h-3" /> Copy URL
                </Button>
              </div>
            </Card>
          )}
        </Card>
      )}
    </div>
  );
}
