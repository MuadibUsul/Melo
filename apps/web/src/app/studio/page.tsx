import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioClientV3 } from "@/components/StudioClientV3";
import { StudioNav } from "@/components/StudioNav";
import { StudioShell } from "@/components/StudioShell";

export default function StudioPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="创作"
        title="创作台"
        description="输入一句想法，或用歌词、声音、风格和参考音频构建一首完整作品。"
      >
        <StudioNav />
        <StudioClientV3 />
      </StudioShell>
    </>
  );
}
