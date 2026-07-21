import Link from "next/link";
import { ArrowRight, Compass, Flame, Radio, Sparkles } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { QuickCreateComposer } from "@/components/QuickCreateComposer";
import { StudioShell } from "@/components/StudioShell";
import { getSeedHotChart, getSeedNewChart, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const genres = [
  { title: "中文流行", description: "城市夜色、旋律副歌和清亮人声", href: "/categories?genre=%E4%B8%AD%E6%96%87%E6%B5%81%E8%A1%8C" },
  { title: "国风", description: "弦乐、箫声、诗意唱腔", href: "/categories?genre=%E5%9B%BD%E9%A3%8E" },
  { title: "R&B", description: "松弛律动、深夜低频", href: "/categories?genre=R%26B" },
  { title: "电子", description: "舞池能量、合成器和强鼓点", href: "/categories?genre=%E7%94%B5%E5%AD%90" },
  { title: "Lo-fi", description: "专注、陪伴、低保真质感", href: "/categories?genre=Lo-fi" },
  { title: "影视配乐", description: "画面推进、情绪铺陈", href: "/categories?genre=%E5%BD%B1%E8%A7%86%E9%85%8D%E4%B9%90" },
];

export default function ExplorePage() {
  const hotTracks = getSeedHotChart();
  const newTracks = getSeedNewChart();
  const playlists = getSeedPublicPlaylists();

  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell title="探索" className="melo-rail-offset melo-mobile-dock-offset" showHeader={false}>
        <section className="mb-8 grid min-h-[420px] gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 px-3 py-1 text-xs text-studio-gold">
              <Compass className="size-3.5" />
              Explore Melo
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              从曲风、榜单和灵感里找到下一首歌
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              快速进入热门声音、编辑歌单、曲风频道和创作提示。探索时听到的风格，也能一键带进创作台。
            </p>
            <QuickCreateComposer className="max-w-3xl" />
          </div>

          <aside className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Flame className="size-5 text-studio-gold" />
              正在升温
            </div>
            <div className="space-y-2">
              {hotTracks.slice(0, 6).map((track, index) => (
                <Link
                  key={track.id}
                  href={`/tracks/${track.id}`}
                  className="flex items-center gap-3 rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
                >
                  <span className="w-6 text-center font-mono text-sm text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{track.creator.displayName}</div>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Radio className="size-5 text-meter-green" />
              曲风频道
            </div>
            <Link href="/categories" className="inline-flex items-center gap-1 text-sm text-studio-gold">
              全部分类
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {genres.map((genre) => (
              <Link
                key={genre.title}
                href={genre.href}
                className="studio-surface rounded-lg p-5 transition hover:border-studio-gold/45"
              >
                <div className="text-lg font-semibold">{genre.title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{genre.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-studio-gold" />
              编辑歌单
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {playlists.slice(0, 4).map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlists/${playlist.id}`}
                  className="studio-surface rounded-lg p-5 transition hover:border-studio-gold/45"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {playlist.owner.displayName}
                  </div>
                  <div className="mt-3 text-lg font-semibold">{playlist.title}</div>
                  <div className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {playlist.tracks.slice(0, 3).map((item) => item.track.title).join(" / ")}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="studio-surface rounded-lg p-5">
            <div className="mb-4 text-lg font-semibold">新声音</div>
            <div className="space-y-2">
              {newTracks.slice(0, 8).map((track, index) => (
                <Link
                  key={track.id}
                  href={`/tracks/${track.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {index + 1}. {track.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{track.creator.displayName}</div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">{track.genre}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </StudioShell>
    </>
  );
}
