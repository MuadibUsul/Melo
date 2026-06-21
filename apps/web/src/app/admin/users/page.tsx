import { AdminUsersPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminUsersPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="\u7528\u6237\u7ba1\u7406">
        <AdminUsersPanel />
      </StudioShell>
    </>
  );
}
