"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildStudioHref } from "@/lib/presets";
import { TemplateButtons } from "./TemplateButtons";

const placeholder =
  "\u5199\u4e00\u9996\u666e\u901a\u8bdd\u4e2d\u6587\u6d41\u884c\u6b4c\uff0c\u5973\u58f0\uff0c\u57ce\u5e02\u591c\u666f\u611f\uff0c\u60c5\u7eea\u514b\u5236\uff0c\u4e3b\u9898\u662f\u4e00\u4e2a\u4eba\u5728\u6df1\u591c\u52a0\u73ed\u540e\u8d70\u5728\u96e8\u91cc\uff0c\u4e0d\u8981\u6a21\u4eff\u4efb\u4f55\u771f\u5b9e\u6b4c\u624b\u3002";

export function HeroPrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function goStudio(nextPrompt = prompt) {
    const query = nextPrompt.trim() ? `?prompt=${encodeURIComponent(nextPrompt.trim())}` : "";
    router.push(`/studio${query}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-panel-border bg-black/25 p-3 shadow-inner">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase text-muted-foreground">
          <Sparkles className="size-3.5 text-studio-gold" />
          {"\u521b\u4f5c\u63d0\u793a"}
        </div>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={placeholder}
          className="min-h-36 resize-none border-0 bg-transparent px-0 text-base leading-7 shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="space-y-4">
        <TemplateButtons
          onSelect={(preset) => {
            setPrompt(preset.prompt);
            router.push(buildStudioHref(preset));
          }}
        />
        <div className="flex justify-end">
          <Button type="button" className="h-11 w-full sm:w-auto" onClick={() => goStudio()}>
            {"\u5f00\u59cb\u521b\u4f5c"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
