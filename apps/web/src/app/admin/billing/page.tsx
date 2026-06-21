import { AdminBillingPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminBillingPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="\u8ba1\u8d39\u7ba1\u7406">
        <AdminBillingPanel />
      </StudioShell>
    </>
  );
}
