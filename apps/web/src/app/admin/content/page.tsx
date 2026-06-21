import { AdminContentPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminContentPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="\u5185\u5bb9\u5ba1\u6838">
        <AdminContentPanel />
      </StudioShell>
    </>
  );
}
