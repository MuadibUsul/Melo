import { AdminUsersPanel } from "@/components/AdminPanels";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminUsersPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="用户管理">
        <AdminUsersPanel />
      </StudioShell>
    </>
  );
}
