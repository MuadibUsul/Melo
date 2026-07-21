import Link from "next/link";
import {
  Archive,
  AudioLines,
  CheckSquare,
  Clock3,
  Compass,
  Download,
  Heart,
  Library,
  ListMusic,
  Lock,
  Mic2,
  MoreHorizontal,
  Plus,
  Radio,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
} from "lucide-react";
import { LibrarySearch } from "@/components/LibrarySearch";
import { LocalPlaylistsPanel } from "@/components/LocalPlaylistsPanel";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { TrackList } from "@/components/TrackList";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/api/server-fetch";
import { formatMeloName } from "@/lib/brand";
import { getSeedHotChart, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface LibraryTrack {
  id: string;
  title: string;
  playCount?: number;
  creator: { displayName: string };
}

interface PlaylistResponse {
  id: string;
  title: string;
  owner?: { displayName: string };
  tracks: Array<{ track: LibraryTrack }>;
}

interface HotTrack {
  id: string;
  title: string;
  playCount: number;
  likeCount?: number;
  creator: { displayName: string };
}

const collectionCards = [
  {
    view: "created",
    label: "我的作品",
    title: "已发布作品",
    description: "管理公开歌曲、封面、评论入口和二次创作权限。",
    icon: Sparkles,
    href: "/library?view=created",
    stat: "12 首",
  },
  {
    view: "liked",
    label: "收藏",
    title: "喜欢的音乐",
    description: "保存灵感、加入歌单，继续从喜欢的作品延展。",
    icon: Heart,
    href: "/library?view=liked",
    stat: "86 首",
  },
  {
    view: "playlists",
    label: "歌单",
    title: "我的歌单",
    description: "整理公开歌单、私密歌单和协作播放列表。",
    icon: ListMusic,
    href: "/library?view=playlists",
    stat: "9 个",
  },
  {
    view: "drafts",
    label: "创作",
    title: "草稿与版本",
    description: "回到生成队列、继续编辑歌词、发布最新版本。",
    icon: AudioLines,
    href: "/studio/drafts",
    stat: "4 个",
  },
  {
    view: "uploads",
    label: "素材",
    title: "参考音频",
    description: "管理上传旋律、哼唱素材、参考片段和授权状态。",
    icon: Upload,
    href: "/library?view=uploads",
    stat: "7 段",
  },
  {
    view: "trash",
    label: "安全区",
    title: "回收站",
    description: "恢复误删作品，或清理不再需要的草稿与素材。",
    icon: Trash2,
    href: "/library?view=trash",
    stat: "2 项",
  },
];

const libraryViews: Record<string, { title: string; description: string; actionHref: string; actionLabel: string }> = {
  created: {
    title: "已发布作品",
    description: "这里汇总你已经发布到 Melo 的歌曲。你可以检查播放表现、进入编辑器、下载音频，或控制 Remix 与延展权限。",
    actionHref: "/studio/editor",
    actionLabel: "打开编辑器",
  },
  liked: {
    title: "喜欢的音乐",
    description: "所有点过喜欢的歌曲会自动收进这里，方便回听、加入歌单，或用相同风格继续创作。",
    actionHref: "/discover",
    actionLabel: "发现新歌",
  },
  playlists: {
    title: "我的歌单",
    description: "整理场景、风格和项目用歌单。公开视频歌单可以被分享，私密歌单只在你的资料库里可见。",
    actionHref: "/playlists/editor-picks",
    actionLabel: "查看示例歌单",
  },
  uploads: {
    title: "参考音频",
    description: "上传的旋律、哼唱、环境声和风格片段都会留在这里，便于在专业模式中复用。",
    actionHref: "/studio/pro",
    actionLabel: "上传参考",
  },
  trash: {
    title: "回收站",
    description: "最近删除的作品、草稿和上传素材会临时保留。发布作品被恢复后会回到原来的可见状态。",
    actionHref: "/studio/drafts",
    actionLabel: "查看草稿",
  },
};

const genres = [
  { title: "中文流行", href: "/categories?genre=%E4%B8%AD%E6%96%87%E6%B5%81%E8%A1%8C" },
  { title: "国风", href: "/categories?genre=%E5%9B%BD%E9%A3%8E" },
  { title: "R&B", href: "/categories?genre=R%26B" },
  { title: "电子", href: "/categories?genre=%E7%94%B5%E5%AD%90" },
  { title: "Lo-fi", href: "/categories?genre=Lo-fi" },
  { title: "影视配乐", href: "/categories?genre=%E5%BD%B1%E8%A7%86%E9%85%8D%E4%B9%90" },
];

async function getPublicPlaylists(): Promise<PlaylistResponse[]> {
  try {
    const response = await serverFetch(`${API_BASE}/playlists/public`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = (await response.json()) as { items?: PlaylistResponse[] };
    return (data.items ?? []).map((playlist) => ({
      ...playlist,
      owner: { displayName: formatMeloName(playlist.owner?.displayName) },
    }));
  } catch {
    return getSeedPublicPlaylists().map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      owner: { displayName: formatMeloName(playlist.owner.displayName) },
      tracks: playlist.tracks.map((item) => ({
        track: {
          id: item.track.id,
          title: item.track.title,
          playCount: item.track.playCount,
          creator: { displayName: item.track.creator.displayName },
        },
      })),
    }));
  }
}

async function getHotTracks(): Promise<HotTrack[]> {
  try {
    const response = await serverFetch(`${API_BASE}/charts/hot`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return getSeedHotChart().map((track) => ({
      id: track.id,
      title: track.title,
      playCount: track.playCount,
      likeCount: track.likeCount,
      creator: { displayName: track.creator.displayName },
    }));
  }
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const activeView = params.view && libraryViews[params.view] ? params.view : null;
  const activeViewMeta = activeView ? libraryViews[activeView] : null;
  const [publicPlaylists, hotTracks] = await Promise.all([getPublicPlaylists(), getHotTracks()]);

  return (
    <main className="studio-backdrop min-h-screen bg-background text-foreground">
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <div className="melo-rail-offset melo-mobile-dock-offset">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.16em] text-studio-gold">
                <Library className="size-3.5" />
                音乐库
              </div>
              <h1 className="text-3xl font-semibold md:text-4xl">你的 Melo 资料库</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                管理作品、收藏、歌单、草稿、上传素材和回收站。这里也是从灵感回听到继续创作的个人工作台。
              </p>
            </div>
            <LibrarySearch initialQuery={query} />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {collectionCards.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`studio-surface rounded-lg p-4 transition hover:border-studio-gold/45 ${
                    isActive ? "border-studio-gold/45 bg-studio-gold/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                    <Icon className="size-4 text-studio-gold" />
                  </div>
                  <div className="mt-3 text-lg font-semibold">{item.title}</div>
                  <p className="mt-2 min-h-12 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  <div className="mt-3 text-xs text-studio-gold">{item.stat}</div>
                </Link>
              );
            })}
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="studio-surface rounded-lg p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-studio-gold">
                      {activeViewMeta ? "当前视图" : "资料库总览"}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">{activeViewMeta?.title ?? "最近整理"}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {activeViewMeta?.description ??
                        "选择一个集合查看作品状态，或使用批量工具整理歌曲、加入歌单、下载音频和控制公开范围。"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href={activeViewMeta?.actionHref ?? "/studio/drafts"}>
                        <Sparkles className="size-4" />
                        {activeViewMeta?.actionLabel ?? "继续创作"}
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/create">
                        <Plus className="size-4" />
                        新建歌曲
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { icon: CheckSquare, label: "批量选择", value: "移动 / 删除 / 加入歌单" },
                    { icon: Share2, label: "分享权限", value: "公开、私密、仅链接可见" },
                    { icon: Download, label: "下载资产", value: "MP3、WAV、歌词、分轨" },
                    { icon: Lock, label: "授权状态", value: "个人使用 / 商用许可" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-lg border border-panel-border bg-black/20 p-4">
                        <Icon className="size-4 text-studio-gold" />
                        <div className="mt-3 text-sm font-medium">{item.label}</div>
                        <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">你的曲目表</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                    按最近活动排序
                  </div>
                </div>
                {activeView === "playlists" ? (
                  <LocalPlaylistsPanel />
                ) : (
                  <TrackList searchQuery={query || undefined} likedOnly={activeView === "liked"} />
                )}
              </div>
            </div>

            <aside className="space-y-5">
              <div className="studio-surface rounded-lg p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-lg font-semibold">继续收听</div>
                  <Link href="/discover" className="text-xs text-studio-gold">
                    去发现
                  </Link>
                </div>
                <div className="space-y-2">
                  {hotTracks.slice(0, 7).map((track, index) => (
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
                      <div className="text-xs text-muted-foreground">{track.playCount.toLocaleString("zh-CN")}</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="studio-surface rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <ListMusic className="size-4 text-studio-gold" />
                  常用歌单
                </div>
                <div className="space-y-3">
                  {publicPlaylists.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      href={`/playlists/${item.id}`}
                      className="block rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45"
                    >
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {(item.tracks ?? []).slice(0, 2).map((track) => track.track.title).join(" / ")}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{item.tracks.length} 首曲目</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="studio-surface rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Archive className="size-4 text-studio-gold" />
                  快速入口
                </div>
                <div className="grid gap-2">
                  {[
                    { icon: Mic2, label: "专业创作", href: "/studio/pro" },
                    { icon: Clock3, label: "生成草稿", href: "/studio/drafts" },
                    { icon: Upload, label: "上传参考音频", href: "/studio/pro" },
                    { icon: Radio, label: "浏览热榜", href: "/charts" },
                    { icon: Search, label: "搜索全站", href: "/search" },
                    { icon: Trophy, label: "挑战榜单", href: "/charts?view=challenge" },
                    { icon: Compass, label: "回到发现", href: "/discover" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg border border-panel-border bg-black/20 px-3 py-2.5 text-sm transition hover:border-studio-gold/45"
                      >
                        <Icon className="size-4 text-studio-gold" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="studio-surface rounded-lg p-5">
                <div className="text-sm font-semibold">风格标签</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {genres.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="rounded-full border border-panel-border px-3 py-1.5 text-xs transition hover:border-studio-gold/45 hover:text-studio-gold"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
