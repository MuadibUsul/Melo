"use client";

import { useState } from "react";
import { GripVertical, Music2, Plus, Sliders, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface ProModeParams {
  lyricsStructure: { section: string; text: string }[];
  referenceAudioUrl?: string;
  referenceAudioType?: "melody" | "style" | "cover";
  advancedSettings: {
    sampleRate: number;
    bitrate: number;
    format: "mp3" | "wav";
    maxDurationSec: number;
    vocalLevel: number;
    instrumentalLevel: number;
    tempo?: number;
    key?: string;
  };
}

export const DEFAULT_PRO_PARAMS: ProModeParams = {
  lyricsStructure: [
    { section: "intro", text: "" },
    { section: "verse", text: "" },
    { section: "chorus", text: "" },
    { section: "verse", text: "" },
    { section: "chorus", text: "" },
    { section: "bridge", text: "" },
    { section: "outro", text: "" },
  ],
  advancedSettings: {
    sampleRate: 44100,
    bitrate: 256000,
    format: "mp3",
    maxDurationSec: 180,
    vocalLevel: 0,
    instrumentalLevel: 0,
  },
};

const SECTIONS = ["intro", "verse", "chorus", "bridge", "outro", "solo", "pre-chorus", "hook"];

export function ProModePanel({
  value,
  onChange,
}: {
  value: ProModeParams;
  onChange: (next: ProModeParams) => void;
}) {
  const [activeTab, setActiveTab] = useState<"structure" | "reference" | "advanced">("structure");

  function updateStructure(index: number, field: "section" | "text", val: string) {
    const next = [...value.lyricsStructure];
    next[index] = { ...next[index]!, [field]: val };
    onChange({ ...value, lyricsStructure: next });
  }

  function addSection() {
    onChange({
      ...value,
      lyricsStructure: [...value.lyricsStructure, { section: "verse", text: "" }],
    });
  }

  function removeSection(index: number) {
    const next = value.lyricsStructure.filter((_, i) => i !== index);
    onChange({ ...value, lyricsStructure: next });
  }

  function updateAdvanced(field: string, val: string | number | undefined) {
    onChange({
      ...value,
      advancedSettings: { ...value.advancedSettings, [field]: val },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-panel-border pb-3">
        {[
          { key: "structure" as const, label: "\u6b4c\u8bcd\u7ed3\u6784", icon: GripVertical },
          { key: "reference" as const, label: "\u53c2\u8003\u97f3\u9891", icon: Music2 },
          { key: "advanced" as const, label: "\u9ad8\u7ea7\u53c2\u6570", icon: Sliders },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "structure" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {
              "\u6309 [verse] / [chorus] / [bridge] \u7b49\u6bb5\u843d\u7ed3\u6784\u7ec4\u7ec7\u6b4c\u8bcd\uff0cAI \u4f1a\u6309\u987a\u5e8f\u751f\u6210\u5bf9\u5e94\u6bb5\u843d\u3002"
            }
          </p>
          {value.lyricsStructure.map((sec, i) => (
            <div key={i} className="flex gap-2 rounded-lg border border-panel-border bg-black/20 p-2">
              <Select value={sec.section} onValueChange={(v) => updateStructure(i, "section", v)}>
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                className="min-h-[40px] flex-1"
                placeholder="\u8f93\u5165\u8be5\u6bb5\u6b4c\u8bcd..."
                value={sec.text}
                onChange={(e) => updateStructure(i, "text", e.target.value)}
                rows={2}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeSection(i)}
                disabled={value.lyricsStructure.length <= 1}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="size-4" /> {"\u6dfb\u52a0\u6bb5\u843d"}
          </Button>
        </div>
      )}

      {activeTab === "reference" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {
              "\u4e0a\u4f20\u53c2\u8003\u97f3\u9891\u4f5c\u4e3a\u98ce\u683c\u6216\u65cb\u5f8b\u53c2\u8003\uff08Cover \u6a21\u5f0f\uff09\u3002\u652f\u6301 mp3 / wav\uff0c\u6700\u957f 60 \u79d2\u3002"
            }
          </p>
          <Input
            placeholder="\u53c2\u8003\u97f3\u9891 URL\uff08\u6216\u4e0a\u4f20\u540e\u586b\u5165\uff09"
            value={value.referenceAudioUrl ?? ""}
            onChange={(e) => onChange({ ...value, referenceAudioUrl: e.target.value || undefined })}
          />
          <Select
            value={value.referenceAudioType ?? "style"}
            onValueChange={(v) =>
              onChange({ ...value, referenceAudioType: v as "melody" | "style" | "cover" })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="style">{"\u98ce\u683c\u53c2\u8003"}</SelectItem>
              <SelectItem value="melody">{"\u65cb\u5f8b\u53c2\u8003"}</SelectItem>
              <SelectItem value="cover">{"Cover \u7ffb\u5531"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {activeTab === "advanced" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "\u91c7\u6837\u7387 (Hz)", field: "sampleRate", type: "number", min: 8000, max: 48000, step: 100 },
            { label: "\u6bd4\u7279\u7387 (bps)", field: "bitrate", type: "number", min: 64000, max: 320000, step: 1000 },
            { label: "\u6700\u957f\u65f6\u957f (\u79d2)", field: "maxDurationSec", type: "number", min: 30, max: 300, step: 10 },
            { label: "\u4eba\u58f0\u6df7\u5408 (dB)", field: "vocalLevel", type: "number", min: -12, max: 12, step: 0.5 },
            { label: "\u4f34\u594f\u6df7\u5408 (dB)", field: "instrumentalLevel", type: "number", min: -12, max: 12, step: 0.5 },
          ].map((f) => (
            <div key={f.field}>
              <label className="mb-1 block text-xs text-muted-foreground">{f.label}</label>
              <Input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={value.advancedSettings[f.field as keyof typeof value.advancedSettings] ?? ""}
                onChange={(e) => updateAdvanced(f.field, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{"\u683c\u5f0f"}</label>
            <Select value={value.advancedSettings.format} onValueChange={(v) => updateAdvanced("format", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{"BPM (\u53ef\u9009)"}</label>
            <Input
              type="number"
              min={40}
              max={240}
              placeholder="\u81ea\u52a8"
              value={value.advancedSettings.tempo ?? ""}
              onChange={(e) => updateAdvanced("tempo", parseInt(e.target.value) || undefined)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{"\u8c03\u5f0f (\u53ef\u9009)"}</label>
            <Input
              placeholder="\u81ea\u52a8"
              value={value.advancedSettings.key ?? ""}
              onChange={(e) => updateAdvanced("key", e.target.value || undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
