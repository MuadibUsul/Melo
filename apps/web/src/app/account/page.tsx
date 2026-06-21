import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { AccountPanel } from "./panel";

export default function AccountPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="账号" title="\u8d26\u53f7">
        <AccountPanel />
      </StudioShell>
    </>
  );
}
