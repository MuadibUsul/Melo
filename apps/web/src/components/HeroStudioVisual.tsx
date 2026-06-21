import { Disc3, RadioTower, SlidersHorizontal } from "lucide-react";
import { VisualMeter } from "./VisualMeter";
import { WaveformPanel } from "./WaveformPanel";

const PARAMS = ["人声", "情绪", "混音"] as const;
const LAYERS = ["歌词", "编曲", "母带"] as const;

export function HeroStudioVisual() {
  return (
    <div className="studio-surface relative overflow-hidden rounded-lg p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px studio-rule opacity-70" />
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Disc3 className="size-4 text-studio-gold" />
          创作会话
        </div>
        <div className="font-mono text-[11px] text-meter-green">MiniMax · AI 生成</div>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.78fr_1fr]">
        <div className="studio-metal rounded-lg border border-panel-border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <RadioTower className="size-4 text-meter-green" />
            生成参数
          </div>
          <VisualMeter active bars={14} />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {PARAMS.map((label) => (
              <div key={label} className="rounded-lg border border-panel-border bg-black/20 p-2">
                <div className="mb-2 text-[10px] uppercase text-muted-foreground">{label}</div>
                <div className="h-1.5 rounded-full bg-studio-gold/60" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <WaveformPanel active />
          <div className="grid grid-cols-3 gap-2">
            {LAYERS.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 px-3 py-2 text-sm"
              >
                <SlidersHorizontal className="size-3.5 text-studio-gold" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
