"use client";

import { Braces, Gauge, Mic, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export interface TtsProParams {
  text: string;
  voiceId: string;
  speed: number;
  vol: number;
  pitch: number;
  emotion: string;
  languageBoost?: string;
  pronunciationDict?: { original: string; replacement: string }[];
  pauses: { position: number; durationMs: number }[];
}

const EMOTIONS = ["auto", "happy", "sad", "angry", "fearful", "disgusted", "surprised", "calm", "neutral"];

const VOICE_PRESETS = [
  { id: "female-sweet", name: "\u751c\u7f8e\u5973\u58f0", lang: "zh", gender: "female" },
  { id: "male-bold", name: "\u6d51\u539a\u7537\u58f0", lang: "zh", gender: "male" },
  { id: "female-calm", name: "\u6e29\u67d4\u5973\u58f0", lang: "zh", gender: "female" },
  { id: "male-young", name: "\u9752\u5e74\u7537\u58f0", lang: "zh", gender: "male" },
  { id: "female-cute", name: "\u841d\u8389\u97f3", lang: "zh", gender: "female" },
  { id: "male-mature", name: "\u6210\u719f\u7537\u58f0", lang: "zh", gender: "male" },
];

export const DEFAULT_TTS: TtsProParams = {
  text: "",
  voiceId: "female-sweet",
  speed: 1.0,
  vol: 1.0,
  pitch: 0,
  emotion: "auto",
  pauses: [],
};

export function TtsProPanel({
  value,
  onChange,
}: {
  value: TtsProParams;
  onChange: (next: TtsProParams) => void;
}) {
  const [activeTab, setActiveTab] = useState<"basic" | "voice" | "dict" | "pauses">("basic");

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-panel-border pb-3">
        {[
          { key: "basic" as const, label: "\u57fa\u7840\u53c2\u6570", icon: Volume2 },
          { key: "voice" as const, label: "\u97f3\u8272\u9009\u62e9", icon: Mic },
          { key: "dict" as const, label: "\u53d1\u97f3\u8bcd\u5178", icon: Braces },
          { key: "pauses" as const, label: "\u505c\u987f\u63a7\u5236", icon: Gauge },
        ].map((tab) => (
          <Button key={tab.key} variant={activeTab === tab.key ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab.key)}>
            <tab.icon className="size-3.5" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "basic" && (
        <div className="space-y-4">
          <Textarea
            placeholder="输入要合成的文本（支持 `<#1#>` 暂停标记）..."
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            rows={5}
            className="min-h-[100px]"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SliderParam label={`\u8bed\u901f ${value.speed.toFixed(1)}x`} min={0.5} max={2.0} step={0.1} value={[value.speed]} onValueChange={([v]) => onChange({ ...value, speed: v! })} />
            <SliderParam label={`\u97f3\u91cf ${value.vol.toFixed(1)}`} min={0} max={10} step={0.1} value={[value.vol]} onValueChange={([v]) => onChange({ ...value, vol: v! })} />
            <SliderParam label={`\u97f3\u8c03 ${value.pitch > 0 ? "+" : ""}${value.pitch}`} min={-12} max={12} step={1} value={[value.pitch]} onValueChange={([v]) => onChange({ ...value, pitch: v! })} />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{"\u60c5\u7eea"}</label>
              <Select value={value.emotion} onValueChange={(v) => onChange({ ...value, emotion: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                {"\u8bed\u8a00\u589e\u5f3a\uff08\u53ef\u9009\uff0c\u5982 zh \u589e\u5f3a\u4e2d\u6587\uff09"}
              </label>
              <Input placeholder="zh" value={value.languageBoost ?? ""} onChange={(e) => onChange({ ...value, languageBoost: e.target.value || undefined })} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "voice" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {VOICE_PRESETS.map((voice) => (
            <div
              key={voice.id}
              className={`cursor-pointer rounded-lg border p-3 transition ${
                value.voiceId === voice.id ? "border-studio-gold bg-studio-gold/10" : "border-panel-border bg-black/20 hover:border-studio-gold/30"
              }`}
              onClick={() => onChange({ ...value, voiceId: voice.id })}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{voice.name}</span>
                <Badge variant="secondary" className="text-[10px]">{voice.lang}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {voice.gender === "female" ? "\u5973\u58f0" : "\u7537\u58f0"} {" \u00b7 "} {voice.id}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "dict" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {
              "\u81ea\u5b9a\u4e49\u53d1\u97f3\u6620\u5c04\uff0c\u4f8b\u5982 AIGC \u2192 A-I-G-C\uff0c\u6df1\u5733 \u2192 shen1 zhen4\u3002"
            }
          </p>
          {(value.pronunciationDict ?? []).map((entry, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="原文"
                value={entry.original}
                onChange={(e) => {
                  const next = [...(value.pronunciationDict ?? [])];
                  next[i] = { ...next[i]!, original: e.target.value };
                  onChange({ ...value, pronunciationDict: next });
                }}
              />
              <Input
                placeholder="替换发音"
                value={entry.replacement}
                onChange={(e) => {
                  const next = [...(value.pronunciationDict ?? [])];
                  next[i] = { ...next[i]!, replacement: e.target.value };
                  onChange({ ...value, pronunciationDict: next });
                }}
              />
              <Button variant="ghost" size="icon-sm" onClick={() => onChange({ ...value, pronunciationDict: (value.pronunciationDict ?? []).filter((_, j) => j !== i) })}>
                ×
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onChange({ ...value, pronunciationDict: [...(value.pronunciationDict ?? []), { original: "", replacement: "" }] })}>
            {"+ \u6dfb\u52a0\u6620\u5c04"}
          </Button>
        </div>
      )}

      {activeTab === "pauses" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {"\u5728\u6587\u672c\u4e2d\u63d2\u5165 "}
            <code className="text-studio-gold">{`<#1#>`}</code>
            {" \u8868\u793a\u505c\u987f\uff0c\u6b64\u5904\u914d\u7f6e\u505c\u987f\u65f6\u957f\u3002"}
          </p>
          {(value.pauses ?? []).map((pause, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 text-sm tabular-nums">{`\u4f4d\u7f6e #${i + 1}`}</span>
              <Input
                type="number"
                placeholder="毫秒"
                value={pause.durationMs}
                onChange={(e) => {
                  const next = [...(value.pauses ?? [])];
                  next[i] = { ...next[i]!, durationMs: parseInt(e.target.value) || 200 };
                  onChange({ ...value, pauses: next });
                }}
              />
              <span className="text-xs text-muted-foreground">ms</span>
              <Button variant="ghost" size="icon-sm" onClick={() => onChange({ ...value, pauses: (value.pauses ?? []).filter((_, j) => j !== i) })}>
                ×
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onChange({ ...value, pauses: [...(value.pauses ?? []), { position: (value.pauses?.length ?? 0) + 1, durationMs: 200 }] })}>
            {"+ \u6dfb\u52a0\u505c\u987f"}
          </Button>
        </div>
      )}
    </div>
  );
}

function SliderParam({
  label,
  min,
  max,
  step,
  value,
  onValueChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number[];
  onValueChange: (v: number[]) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0] ?? min}
        onChange={(e) => onValueChange([parseFloat(e.target.value)])}
        className="h-1.5 w-full accent-studio-gold"
      />
    </div>
  );
}
