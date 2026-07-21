import { DraftList } from "@/components/DraftList";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioNav } from "@/components/StudioNav";
import { StudioShell } from "@/components/StudioShell";

export default function StudioDraftsPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="草稿"
        title="草稿管理"
        description="查看生成历史、试听草稿、继续编辑版本，或把满意的作品发布到 Melo。"
      >
        <StudioNav />
        <DraftList />
      </StudioShell>
    </>
  );
}
