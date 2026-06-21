import { AdminCostsPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminCostsPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="\u6210\u672c\u76d1\u63a7">
        <AdminCostsPanel />
      </StudioShell>
    </>
  );
}
