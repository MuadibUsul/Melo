import { SiteNav } from "@/components/SiteNav";
import { StudioClientV3 } from "@/components/StudioClientV3";
import { StudioShell } from "@/components/StudioShell";
import { StudioNav } from "@/components/StudioNav";

export default function StudioPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="创作" title="\u521b\u4f5c">
        <StudioNav />
        <StudioClientV3 />
      </StudioShell>
    </>
  );
}
