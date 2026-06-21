import { DraftList } from "@/components/DraftList";
import { SiteNav } from "@/components/SiteNav";
import { StudioNav } from "@/components/StudioNav";
import { StudioShell } from "@/components/StudioShell";

export default function StudioDraftsPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="草稿" title="\u8349\u7a3f\u7ba1\u7406">
        <StudioNav />
        <DraftList />
      </StudioShell>
    </>
  );
}
