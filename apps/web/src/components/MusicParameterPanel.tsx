"use client";

import type { GenerateRequest } from "@/types/music";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PresetChip } from "./PresetChip";
import { PromptInput } from "./PromptInput";

const lyricsModes = [
  { label: "AI 写词", value: "ai" },
  { label: "自填歌词", value: "custom" },
  { label: "纯音乐", value: "instrumental" },
] as const;

const genres = ["中文流行", "说唱", "国风", "民谣", "电子", "摇滚", "Lo-fi", "影视配乐", "游戏配乐"];
const moods = [
  "治愈",
  "孤独",
  "热血",
  "赛博朋克",
  "悲伤",
  "轻松",
  "高级",
  "神秘",
  "诗意",
  "暧昧",
  "平静",
  "史诗",
  "冒险",
  "锐利",
  "温暖",
  "慵懒",
  "庄重",
];
const vocals = ["男声", "女声", "合唱", "无人声", "清亮女声", "低沉男声", "温柔女声", "青年男声", "合唱声场", "旁白音色"];
const durations = ["30 秒片段", "60 秒试听版", "完整歌曲"];

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
      next.vocal = "无人声";
      next.lyrics = "";
    }

    if (key === "vocal" && nextValue === "无人声") {
      next.lyricsMode = "instrumental";
      next.lyrics = "";
    }

    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">中文需求</Label>
        <PromptInput
          value={value.prompt}
          onChange={(next) => setValue("prompt", next)}
          placeholder="例如：写一首普通话中文流行歌，女声，城市夜景感，副歌适合合唱。"
        />
      </div>

      <div className="grid gap-5">
        <ChipGroup
          label="歌词模式"
          value={value.lyricsMode}
          options={lyricsModes}
          onValueChange={(next) => setValue("lyricsMode", next as GenerateRequest["lyricsMode"])}
        />

        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">歌词</Label>
          <Textarea
            value={value.lyrics ?? ""}
            disabled={value.lyricsMode === "instrumental"}
            onChange={(event) => setValue("lyrics", event.target.value)}
            placeholder={"[Intro]\n[Verse]\n写下主歌...\n[Chorus]\n写下副歌..."}
            className="min-h-36 resize-none rounded-lg border-panel-border bg-black/25 leading-7 disabled:opacity-45"
          />
        </div>

        <ChipGroup label="风格" value={value.genre ?? ""} options={genres} onValueChange={(next) => setValue("genre", next)} />
        <ChipGroup label="情绪" value={value.mood ?? ""} options={moods} onValueChange={(next) => setValue("mood", next)} />
        <ChipGroup label="人声" value={value.vocal ?? ""} options={vocals} onValueChange={(next) => setValue("vocal", next)} />
        <ChipGroup
          label="时长"
          value={value.durationPreset ?? ""}
          options={durations}
          onValueChange={(next) => setValue("durationPreset", next)}
        />
      </div>
    </div>
  );
}
