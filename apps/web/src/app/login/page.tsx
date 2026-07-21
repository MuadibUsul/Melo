import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { LoginPanel } from "./panel";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;

  return (
    <main className="studio-backdrop min-h-screen bg-background text-foreground">
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <div className="melo-rail-offset melo-mobile-dock-offset">
        <LoginPanel nextHref={params.next} />
      </div>
    </main>
  );
}
