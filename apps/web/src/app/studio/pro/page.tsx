import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { StudioClientV3 } from "@/components/StudioClientV3";
import { StudioNav } from "@/components/StudioNav";

export default function StudioProPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="专业" title="\u4e13\u4e1a\u521b\u4f5c">
        <StudioNav />
        <StudioClientV3 />
      </StudioShell>
    </>
  );
}
