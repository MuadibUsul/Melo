import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { StudioClientV3 } from "@/components/StudioClientV3";
import { StudioNav } from "@/components/StudioNav";

export default function StudioSimplePage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="简易" title="\u7b80\u6613\u521b\u4f5c">
        <StudioNav />
        <StudioClientV3 />
      </StudioShell>
    </>
  );
}
