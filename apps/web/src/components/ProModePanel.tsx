"use client";

import { useState } from "react";
import { GripVertical, Loader2, Music2, Plus, Sliders, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";

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

export type ProModeTab = "structure" | "reference" | "advanced";

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
  initialTab = "structure",
}: {
  value: ProModeParams;
  onChange: (next: ProModeParams) => void;
  initialTab?: ProModeTab;
}) {
  const [activeTab, setActiveTab] = useState<ProModeTab>(initialTab);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

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

  async function uploadReferenceAudio(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const contentType = file.type || "audio/mpeg";
      const prepared = await api.post<{
        assetId: string;
        uploadUrl: string;
        method: "PUT";
        headers: Record<string, string>;
      }>("/assets/upload-url", {
        filename: file.name,
        contentType,
        sizeBytes: file.size,
        usage: "reference_audio",
      });

      const uploadResponse = await fetch(prepared.uploadUrl, {
        method: prepared.method,
        headers: prepared.headers,
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("上传参考音频失败");

      const playback = await api.get<{ url: string }>(`/assets/${prepared.assetId}/play`);
      onChange({ ...value, referenceAudioUrl: playback.url });
      setUploadMessage("参考音频已上传，并已填入当前创作。");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "上传参考音频失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-panel-border pb-3">
        {[
          { key: "structure" as const, label: "歌词结构", icon: GripVertical },
          { key: "reference" as const, label: "参考音频", icon: Music2 },
          { key: "advanced" as const, label: "高级参数", icon: Sliders },
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
            按 [verse] / [chorus] / [bridge] 等段落结构组织歌词，Melo 会按顺序生成对应段落。
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
                placeholder="输入该段歌词..."
                value={sec.text}
                onChange={(e) => updateStructure(i, "text", e.target.value)}
                rows={2}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeSection(i)}
                disabled={value.lyricsStructure.length <= 1}
                aria-label="删除段落"
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="size-4" /> 添加段落
          </Button>
        </div>
      )}

      {activeTab === "reference" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            上传参考音频作为风格、旋律或翻唱参考。适合延展旧草稿、保留哼唱旋律，或把一段声音转成完整编曲。
          </p>
          <Input
            placeholder="参考音频 URL，或上传后自动填入"
            value={value.referenceAudioUrl ?? ""}
            onChange={(e) => onChange({ ...value, referenceAudioUrl: e.target.value || undefined })}
          />
          <div className="rounded-lg border border-panel-border bg-black/20 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">上传参考音频</div>
                <div className="mt-1 text-xs text-muted-foreground">支持 mp3、wav、m4a、ogg，最大 50MB。</div>
              </div>
              <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-panel-border px-3 text-sm transition hover:border-studio-gold/45">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {uploading ? "上传中" : "选择文件"}
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    void uploadReferenceAudio(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {uploadMessage ? <div className="mt-3 text-xs text-muted-foreground">{uploadMessage}</div> : null}
          </div>
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
              <SelectItem value="style">风格参考</SelectItem>
              <SelectItem value="melody">旋律参考</SelectItem>
              <SelectItem value="cover">Cover 翻唱</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {activeTab === "advanced" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "采样率 (Hz)", field: "sampleRate", min: 8000, max: 48000, step: 100 },
            { label: "比特率 (bps)", field: "bitrate", min: 64000, max: 320000, step: 1000 },
            { label: "最长时长 (秒)", field: "maxDurationSec", min: 30, max: 300, step: 10 },
            { label: "人声混合 (dB)", field: "vocalLevel", min: -12, max: 12, step: 0.5 },
            { label: "伴奏混合 (dB)", field: "instrumentalLevel", min: -12, max: 12, step: 0.5 },
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
            <label className="mb-1 block text-xs text-muted-foreground">格式</label>
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
            <label className="mb-1 block text-xs text-muted-foreground">BPM (可选)</label>
            <Input
              type="number"
              min={40}
              max={240}
              placeholder="自动"
              value={value.advancedSettings.tempo ?? ""}
              onChange={(e) => updateAdvanced("tempo", parseInt(e.target.value) || undefined)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">调式 (可选)</label>
            <Input
              placeholder="自动"
              value={value.advancedSettings.key ?? ""}
              onChange={(e) => updateAdvanced("key", e.target.value || undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
