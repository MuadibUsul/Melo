import { SiteNav } from "@/components/SiteNav";
import { LoginPanel } from "./panel";

export default function LoginPage() {
  return (
    <main className="studio-backdrop min-h-screen bg-background text-foreground">
      <SiteNav />
      <LoginPanel />
    </main>
  );
}
