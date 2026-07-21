import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { AccountPanel } from "./panel";

export default function AccountPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="账号"
        title="账号与额度"
        description="查看个人资料、订阅状态、创作额度、安全设置和常用入口。"
      >
        <AccountPanel />
      </StudioShell>
    </>
  );
}
