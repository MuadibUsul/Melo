"use client";

import type { GenerateRequest } from "@/types/music";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PresetChip } from "./PresetChip";
import { PromptInput } from "./PromptInput";

const lyricsModes = [
  { label: "AI \u5199\u8bcd", value: "ai" },
  { label: "\u81ea\u586b\u6b4c\u8bcd", value: "custom" },
  { label: "\u7eaf\u97f3\u4e50", value: "instrumental" },
] as const;

const genres = [
  "\u4e2d\u6587\u6d41\u884c",
  "\u8bf4\u5531",
  "\u56fd\u98ce",
  "\u6c11\u8c23",
  "\u7535\u5b50",
  "\u6447\u6eda",
  "Lo-fi",
  "\u5f71\u89c6\u914d\u4e50",
  "\u6e38\u620f\u914d\u4e50",
];
const moods = [
  "\u6cbb\u6108",
  "\u5b64\u72ec",
  "\u70ed\u8840",
  "\u8d5b\u535a\u670b\u514b",
  "\u60b2\u4f24",
  "\u8f7b\u677e",
  "\u9ad8\u7ea7",
  "\u795e\u79d8",
];
const vocals = ["\u7537\u58f0", "\u5973\u58f0", "\u5408\u5531", "\u65e0\u4eba\u58f0"];
const durations = ["30 \u79d2\u7247\u6bb5", "60 \u79d2\u8bd5\u542c\u7248", "\u5b8c\u6574\u6b4c\u66f2"];

interface MusicParameterPanelProps {
  value: GenerateRequest;
  onChange: (next: GenerateRequest) => void;
}

function ChipGroup({
  label,
  value,
  options,
  onValueChange,
  disabled,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<string | { label: string; value: string }>;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const item = typeof option === "string" ? { label: option, value: option } : option;
          return (
            <PresetChip
              key={item.value}
              label={item.label}
              selected={value === item.value}
              disabled={disabled}
              onClick={() => onValueChange(item.value)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function MusicParameterPanel({ value, onChange }: MusicParameterPanelProps) {
  const setValue = <K extends keyof GenerateRequest>(key: K, nextValue: GenerateRequest[K]) => {
    const next = { ...value, [key]: nextValue };

    if (key === "lyricsMode" && nextValue === "instrumental") {
      next.vocal = "\u65e0\u4eba\u58f0";
      next.lyrics = "";
    }

    if (key === "vocal" && nextValue === "\u65e0\u4eba\u58f0") {
      next.lyricsMode = "instrumental";
      next.lyrics = "";
    }

    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">
          {"\u4e2d\u6587\u9700\u6c42"}
        </Label>
        <PromptInput
          value={value.prompt}
          onChange={(next) => setValue("prompt", next)}
          placeholder="\u4f8b\u5982\uff1a\u5199\u4e00\u9996\u666e\u901a\u8bdd\u4e2d\u6587\u6d41\u884c\u6b4c\uff0c\u5973\u58f0\uff0c\u57ce\u5e02\u591c\u666f\u611f..."
        />
      </div>

      <div className="grid gap-5">
        <ChipGroup
          label="\u6b4c\u8bcd\u6a21\u5f0f"
          value={value.lyricsMode}
          options={lyricsModes}
          onValueChange={(next) => setValue("lyricsMode", next as GenerateRequest["lyricsMode"])}
        />

        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">{"\u6b4c\u8bcd"}</Label>
          <Textarea
            value={value.lyrics ?? ""}
            disabled={value.lyricsMode === "instrumental"}
            onChange={(event) => setValue("lyrics", event.target.value)}
            placeholder={"[Intro]\n[Verse]\n...\n[Chorus]\n..."}
            className="min-h-36 resize-none rounded-lg border-panel-border bg-black/25 leading-7 disabled:opacity-45"
          />
        </div>

        <ChipGroup
          label="\u98ce\u683c"
          value={value.genre ?? ""}
          options={genres}
          onValueChange={(next) => setValue("genre", next)}
        />
        <ChipGroup
          label="\u60c5\u7eea"
          value={value.mood ?? ""}
          options={moods}
          onValueChange={(next) => setValue("mood", next)}
        />
        <ChipGroup
          label="\u4eba\u58f0"
          value={value.vocal ?? ""}
          options={vocals}
          onValueChange={(next) => setValue("vocal", next)}
        />
        <ChipGroup
          label="\u65f6\u957f"
          value={value.durationPreset ?? ""}
          options={durations}
          onValueChange={(next) => setValue("durationPreset", next)}
        />
      </div>
    </div>
  );
}
