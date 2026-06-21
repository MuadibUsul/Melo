import Link from "next/link";
import { Music2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { StudioNav } from "@/components/StudioNav";

const PRESETS = [
  { genre: "中文流行", mood: "治愈", vocal: "女声", desc: "温柔旋律、女声主唱，适合日常收听与情感表达" },
  { genre: "国风", mood: "诗意", vocal: "女声", desc: "古典乐器融合现代编曲，营造东方意境" },
  { genre: "R&B", mood: "暧昧", vocal: "男声", desc: "松弛律动与低频贝斯，夜晚氛围感十足" },
  { genre: "电子", mood: "热烈", vocal: "合唱", desc: "合成器音墙与舞曲律动，适合派对与锻炼" },
  { genre: "Lo-fi", mood: "治愈", vocal: "无人声", desc: "温暖采样配慢速鼓点，专注陪伴型背景音" },
  { genre: "纯音乐", mood: "平静", vocal: "无人声", desc: "钢琴与弦乐为主，适合冥想、工作与阅读" },
  { genre: "影视配乐", mood: "史诗", vocal: "无人声", desc: "大动态铺陈与情绪推进，画面感十足" },
  { genre: "游戏配乐", mood: "冒险", vocal: "无人声", desc: "像素冒险、战斗循环与关卡主题风格" },
  { genre: "说唱", mood: "锋利", vocal: "男声", desc: "中文 flow 与鼓组冲击，街头叙事感" },
  { genre: "民谣", mood: "温暖", vocal: "女声", desc: "木吉他、口琴与轻叙事，自然温暖" },
  { genre: "爵士", mood: "慵懒", vocal: "无人声", desc: "即兴感与蓝调色彩，午后咖啡馆氛围" },
  { genre: "古典", mood: "庄重", vocal: "无人声", desc: "管弦乐全编制，宏大叙事与精致细节" },
];

export default function StudioPresetsPage() {
  return (
    <>
      <SiteNav />
      <main className="studio-backdrop min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-lg border border-panel-border bg-black/20 px-3 py-1 text-xs uppercase text-studio-gold">预设</div>
            <h1 className="text-3xl font-semibold">风格预设</h1>
            <p className="mt-2 text-sm text-muted-foreground">选择预设后直接进入工作台，参数已自动填充。</p>
          </div>
          <StudioNav />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PRESETS.map((preset) => (
              <Link
                key={preset.genre}
                href={`/studio/simple?genre=${encodeURIComponent(preset.genre)}&mood=${encodeURIComponent(preset.mood)}&vocal=${encodeURIComponent(preset.vocal)}`}
                className="studio-surface rounded-lg p-5 transition hover:border-studio-gold/45"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-studio-gold/10">
                    <Music2 className="size-4 text-studio-gold" />
                  </div>
                  <div className="font-semibold">{preset.genre}</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{preset.desc}</p>
                <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                  <span className="rounded border border-panel-border px-2 py-0.5">{preset.mood}</span>
                  <span className="rounded border border-panel-border px-2 py-0.5">{preset.vocal}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
