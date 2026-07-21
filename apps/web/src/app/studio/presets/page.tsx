import Link from "next/link";
import { ArrowRight, Music2, Sparkles } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioNav } from "@/components/StudioNav";
import { StudioShell } from "@/components/StudioShell";

const PRESETS = [
  { genre: "中文流行", mood: "治愈", vocal: "女声", desc: "温柔旋律、女声主唱，适合日常收听与情感表达。" },
  { genre: "国风", mood: "诗意", vocal: "女声", desc: "古典乐器融合现代编曲，营造东方意境。" },
  { genre: "R&B", mood: "暧昧", vocal: "男声", desc: "松弛律动与低频贝斯，深夜氛围感十足。" },
  { genre: "电子", mood: "热烈", vocal: "合唱", desc: "合成器音墙与舞曲律动，适合派对与高能剪辑。" },
  { genre: "Lo-fi", mood: "治愈", vocal: "无人声", desc: "温暖采样配慢速鼓点，专注陪伴型背景音乐。" },
  { genre: "纯音乐", mood: "平静", vocal: "无人声", desc: "钢琴与弦乐为主，适合冥想、工作与阅读。" },
  { genre: "影视配乐", mood: "史诗", vocal: "无人声", desc: "大动态铺陈与情绪推进，画面感十足。" },
  { genre: "游戏配乐", mood: "冒险", vocal: "无人声", desc: "像素冒险、战斗循环与关卡主题风格。" },
  { genre: "说唱", mood: "锐利", vocal: "男声", desc: "中文 flow 与鼓组冲击，街头叙事感。" },
  { genre: "民谣", mood: "温暖", vocal: "女声", desc: "木吉他、口琴与轻叙事，自然温暖。" },
  { genre: "爵士", mood: "慵懒", vocal: "无人声", desc: "即兴感与蓝调色彩，适合午后咖啡馆氛围。" },
  { genre: "古典", mood: "庄重", vocal: "无人声", desc: "管弦乐全编制，宏大叙事与精致细节。" },
];

export default function StudioPresetsPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="预设" title="风格预设" description="选择预设后直接进入工作台，风格、情绪和人声会自动填充。">
        <StudioNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PRESETS.map((preset) => {
            const href = `/studio/simple?genre=${encodeURIComponent(preset.genre)}&mood=${encodeURIComponent(
              preset.mood,
            )}&vocal=${encodeURIComponent(preset.vocal)}`;
            return (
              <Link
                key={preset.genre}
                href={href}
                className="studio-surface rounded-lg p-5 transition hover:border-studio-gold/45"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-studio-gold/10">
                    <Music2 className="size-4 text-studio-gold" />
                  </div>
                  <div className="font-semibold">{preset.genre}</div>
                </div>
                <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{preset.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded border border-panel-border px-2 py-0.5">{preset.mood}</span>
                  <span className="rounded border border-panel-border px-2 py-0.5">{preset.vocal}</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-studio-gold">
                  使用预设
                  <ArrowRight className="size-3.5" />
                </div>
              </Link>
            );
          })}
        </div>

        <section className="mt-8 rounded-lg border border-panel-border bg-black/20 p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-4 text-studio-gold" />
            预设使用建议
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            预设只是起点。进入快速创作后，你可以继续修改提示词、歌词模式、风格和人声，也可以切到自定义创作加入参考音频。
          </p>
        </section>
      </StudioShell>
    </>
  );
}
