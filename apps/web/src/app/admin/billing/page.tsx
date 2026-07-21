import { AdminBillingPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminBillingPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="计费管理">
        <AdminBillingPanel />
      </StudioShell>
    </>
  );
}
