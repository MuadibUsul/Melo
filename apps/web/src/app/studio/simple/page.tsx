import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { StudioClientV3 } from "@/components/StudioClientV3";
import { StudioNav } from "@/components/StudioNav";
import type { GenerateRequest } from "@/types/music";

export default async function StudioSimplePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string; genre?: string; mood?: string; vocal?: string; lyricsMode?: string }>;
}) {
  const params = await searchParams;
  const lyricsMode: GenerateRequest["lyricsMode"] | undefined =
    params.lyricsMode === "instrumental" || params.lyricsMode === "custom" || params.lyricsMode === "ai"
      ? params.lyricsMode
      : undefined;
  const initial: Partial<GenerateRequest> = {
    ...(params.prompt ? { prompt: params.prompt } : {}),
    ...(params.genre ? { genre: params.genre } : {}),
    ...(params.mood ? { mood: params.mood } : {}),
    ...(params.vocal ? { vocal: params.vocal } : {}),
    ...(lyricsMode ? { lyricsMode } : {}),
  };
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="快速创作"
        title="快速创作"
        description="用一句中文提示词生成歌曲，适合快速记录灵感、探索风格和试方向。"
      >
        <StudioNav />
        <StudioClientV3 initial={Object.keys(initial).length > 0 ? initial : undefined} />
      </StudioShell>
    </>
  );
}
