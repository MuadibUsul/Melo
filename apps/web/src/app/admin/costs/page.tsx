import { AdminCostsPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminCostsPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="成本监控">
        <AdminCostsPanel />
      </StudioShell>
    </>
  );
}
