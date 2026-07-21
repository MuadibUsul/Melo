import Link from "next/link";
import { AudioLines, Compass, WandSparkles } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { TrackList } from "@/components/TrackList";
import { Button } from "@/components/ui/button";

const genres = ["中文流行", "国风", "R&B", "电子", "Lo-fi", "纯音乐", "影视配乐", "游戏配乐", "说唱", "民谣"];

const genrePrompts: Record<string, string[]> = {
  中文流行: ["夏夜来信，温暖女声，中文流行", "城市夜行，副歌明亮，适合合唱"],
  国风: ["国风电子，竹笛和低频鼓组", "月下归舟，古筝与女声吟唱"],
  "R&B": ["深夜 R&B，低频律动，男声", "蓝色凌晨，暧昧和声，慢速节拍"],
  电子: ["霓虹舞池，强鼓点，合成器主导", "赛博朋克开场，适合短视频"],
  "Lo-fi": ["雨声和钢琴，适合深夜写作", "咖啡馆 Lo-fi，柔和鼓点"],
  纯音乐: ["温暖钢琴与弦乐，适合片头", "极简氛围，留白充足"],
  影视配乐: ["悬疑片尾，低音弦乐，渐强", "治愈纪录片，木吉他和钢琴"],
  游戏配乐: ["冒险地图主题，管弦与打击乐", "像素 RPG 城镇，轻快循环"],
  说唱: ["中文说唱，冷静叙事，干净鼓组", "街头采样，强拍点，副歌可记忆"],
  民谣: ["木吉他民谣，夏日晚风，男声", "旅途日记，口琴与轻鼓"],
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const params = await searchParams;
  const active = params.genre ?? genres[0]!;
  const prompts = genrePrompts[active] ?? [`${active} 风格，创作一首新的中文歌曲`, `${active} 氛围，适合循环播放`];

  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="分类" title={active} description="按风格、场景和创作语气浏览 Melo 曲库。">
        <section className="mb-6 overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.18),rgba(17,19,23,0.96)_48%,rgba(39,224,167,0.10))] p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-black/20 px-3 py-1 text-xs text-studio-gold">
                <Compass className="size-3.5" />
                Category
              </div>
              <h1 className="mt-4 text-4xl font-semibold">{active}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                浏览该风格下的热门作品，也可以把风格直接变成新的创作提示。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/categories?genre=${encodeURIComponent(genre)}`}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      genre === active
                        ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                        : "border-panel-border text-muted-foreground hover:border-studio-gold/45 hover:text-foreground"
                    }`}
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-panel-border bg-black/25 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <WandSparkles className="size-4 text-studio-gold" />
                用这个风格创作
              </div>
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <Button key={prompt} asChild variant="outline" className="h-auto w-full justify-start whitespace-normal py-3 text-left">
                    <Link href={`/studio/simple?prompt=${encodeURIComponent(prompt)}&genre=${encodeURIComponent(active)}`}>{prompt}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <AudioLines className="size-5 text-studio-gold" />
          {active} 作品
        </section>
        <TrackList genre={active} />
      </StudioShell>
    </>
  );
}
