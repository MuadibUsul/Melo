import { AdminContentPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminContentPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="内容审核">
        <AdminContentPanel />
      </StudioShell>
    </>
  );
}
