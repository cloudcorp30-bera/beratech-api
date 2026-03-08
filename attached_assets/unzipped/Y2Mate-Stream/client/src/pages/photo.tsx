import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  Copy,
  ExternalLink,
  Download,
  Search,
} from "lucide-react";

interface EffectItem {
  slug: string;
  name: string;
  description: string;
  endpoint: string;
}

interface EffectListResponse {
  status: number;
  success: boolean;
  result: {
    total_effects: number;
    effects: {
      single_text: EffectItem[];
      dual_text: EffectItem[];
      triple_text: EffectItem[];
    };
  };
}

export default function PhotoPage() {
  const [selectedEffect, setSelectedEffect] = useState<EffectItem | null>(null);
  const [text, setText] = useState("");
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [text3, setText3] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: effectsData, isLoading: loadingEffects } = useQuery<EffectListResponse>({
    queryKey: ["/api/ephoto360/list"],
  });

  const allEffects = effectsData?.result?.effects;

  const getTextInputCount = (effect: EffectItem): number => {
    if (allEffects?.single_text.some(e => e.slug === effect.slug)) return 1;
    if (allEffects?.dual_text.some(e => e.slug === effect.slug)) return 2;
    if (allEffects?.triple_text.some(e => e.slug === effect.slug)) return 3;
    return 1;
  };

  const flatEffects = allEffects
    ? [...allEffects.single_text, ...allEffects.dual_text, ...allEffects.triple_text]
    : [];

  const filteredEffects = searchTerm
    ? flatEffects.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : flatEffects;

  const ephotoMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEffect) throw new Error("Select an effect first");
      const inputCount = getTextInputCount(selectedEffect);
      const params = new URLSearchParams();

      if (inputCount === 1) {
        params.set("text", text);
      } else if (inputCount === 2) {
        params.set("text1", text1);
        params.set("text2", text2);
      } else {
        params.set("text1", text1);
        params.set("text2", text2);
        params.set("text3", text3);
      }

      const res = await fetch(`/api/ephoto360/${selectedEffect.slug}?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }
      return res.json();
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err?.message, variant: "destructive" });
    },
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  };

  const inputCount = selectedEffect ? getTextInputCount(selectedEffect) : 1;
  const canGenerate = selectedEffect && (
    inputCount === 1 ? text.trim() :
    inputCount === 2 ? text1.trim() && text2.trim() :
    text1.trim() && text2.trim() && text3.trim()
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-photo-title">EPhoto360 Effects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {effectsData?.result?.total_effects || 0} text effects with permanent image hosting
        </p>
      </div>

      <Card className="p-5 space-y-4 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-foreground">Select Effect</h2>
          {selectedEffect && (
            <Badge variant="default" data-testid="badge-selected-effect">
              {selectedEffect.name}
            </Badge>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-effect-search"
            placeholder="Search effects... (e.g. deadpool, neon, marvel)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {loadingEffects ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <>
            {allEffects && (
              <div className="space-y-3">
                {allEffects.single_text.length > 0 && filteredEffects.some(e => allEffects.single_text.some(s => s.slug === e.slug)) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Single Text Input</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredEffects.filter(e => allEffects.single_text.some(s => s.slug === e.slug)).map((effect) => (
                        <Button
                          key={effect.slug}
                          variant={selectedEffect?.slug === effect.slug ? "default" : "outline"}
                          size="sm"
                          onClick={() => { setSelectedEffect(effect); setText(""); setText1(""); setText2(""); setText3(""); }}
                          data-testid={`button-effect-${effect.slug}`}
                        >
                          {effect.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {allEffects.dual_text.length > 0 && filteredEffects.some(e => allEffects.dual_text.some(s => s.slug === e.slug)) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dual Text Input</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredEffects.filter(e => allEffects.dual_text.some(s => s.slug === e.slug)).map((effect) => (
                        <Button
                          key={effect.slug}
                          variant={selectedEffect?.slug === effect.slug ? "default" : "outline"}
                          size="sm"
                          onClick={() => { setSelectedEffect(effect); setText(""); setText1(""); setText2(""); setText3(""); }}
                          data-testid={`button-effect-${effect.slug}`}
                        >
                          {effect.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {allEffects.triple_text.length > 0 && filteredEffects.some(e => allEffects.triple_text.some(s => s.slug === e.slug)) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Triple Text Input</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredEffects.filter(e => allEffects.triple_text.some(s => s.slug === e.slug)).map((effect) => (
                        <Button
                          key={effect.slug}
                          variant={selectedEffect?.slug === effect.slug ? "default" : "outline"}
                          size="sm"
                          onClick={() => { setSelectedEffect(effect); setText(""); setText1(""); setText2(""); setText3(""); }}
                          data-testid={`button-effect-${effect.slug}`}
                        >
                          {effect.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {selectedEffect && (
        <Card className="p-5 space-y-4 animate-scale-in">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{selectedEffect.name}</h2>
            <Badge variant="secondary" className="text-xs">{selectedEffect.description}</Badge>
          </div>

          <div className="space-y-3">
            {inputCount === 1 ? (
              <Input
                data-testid="input-ephoto-text"
                placeholder="Enter your text..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="text-base"
              />
            ) : (
              <>
                <Input
                  data-testid="input-ephoto-text1"
                  placeholder="Text 1 (e.g. name, title)"
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                  className="text-base"
                />
                <Input
                  data-testid="input-ephoto-text2"
                  placeholder="Text 2 (e.g. subtitle, slogan)"
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                  className="text-base"
                />
                {inputCount === 3 && (
                  <Input
                    data-testid="input-ephoto-text3"
                    placeholder="Text 3 (e.g. tagline)"
                    value={text3}
                    onChange={(e) => setText3(e.target.value)}
                    className="text-base"
                  />
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground font-mono flex-1">
              GET /api/ephoto360/{selectedEffect.slug}
              {inputCount === 1 ? `?text=${text || "YOUR_TEXT"}` :
               inputCount === 2 ? `?text1=${text1 || "TEXT_ONE"}&text2=${text2 || "TEXT_TWO"}` :
               `?text1=${text1 || "TEXT_ONE"}&text2=${text2 || "TEXT_TWO"}&text3=${text3 || "TEXT_THREE"}`}
            </p>
          </div>

          <Button
            data-testid="button-generate-ephoto"
            onClick={() => ephotoMutation.mutate()}
            disabled={!canGenerate || ephotoMutation.isPending}
            className="w-full"
          >
            {ephotoMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Effect</>
            )}
          </Button>

          {ephotoMutation.isPending && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Creating your text effect & uploading...</p>
            </div>
          )}

          {ephotoMutation.data?.result && !ephotoMutation.isPending && (
            <Card className="p-4 bg-muted/30 space-y-3 animate-fade-in-up">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {ephotoMutation.data.result.effect}
                </Badge>
                <span className="text-xs text-muted-foreground">Permanent URL generated</span>
              </div>
              <img
                src={ephotoMutation.data.result.image_url}
                alt={`${selectedEffect.name} effect`}
                className="w-full max-w-lg mx-auto rounded-md"
                data-testid="img-ephoto-result"
              />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" asChild>
                  <a href={ephotoMutation.data.result.image_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyUrl(ephotoMutation.data.result.image_url)}>
                  <Copy className="w-3.5 h-3.5" /> Copy URL
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={ephotoMutation.data.result.image_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                </Button>
              </div>
            </Card>
          )}
        </Card>
      )}
    </div>
  );
}
