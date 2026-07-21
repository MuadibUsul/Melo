import { Music2 } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";

interface MeloTargetLoadingProps {
  label?: string;
  feedLabel?: string;
}

export function MeloTargetLoading({
  label = "正在加载 Melo",
  feedLabel = "正在加载发现页内容",
}: MeloTargetLoadingProps) {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <main className="studio-backdrop melo-rail-offset melo-mobile-dock-offset min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <section className="flex min-h-[340px] flex-col items-center justify-center text-center">
            <div
              className="mb-5 flex items-center gap-2 rounded-lg border border-panel-border bg-black/25 px-3 py-1 text-xs text-muted-foreground"
              role="status"
              aria-label={label}
            >
              <Music2 className="size-3.5 text-studio-gold" />
              {label}
            </div>
            <div className="h-10 w-full max-w-[640px] animate-pulse rounded-lg bg-white/[0.08] sm:h-12" />
            <div className="mt-3 h-4 w-full max-w-[520px] animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-8 w-full max-w-3xl rounded-lg border border-panel-border bg-black/25 p-3 text-left">
              <div className="h-24 animate-pulse rounded-md bg-white/[0.06]" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="h-9 w-32 animate-pulse rounded-lg bg-white/[0.06]" />
                <div className="h-10 w-28 animate-pulse rounded-lg bg-studio-gold/15" />
              </div>
            </div>
          </section>

          <section
            className="mt-4 rounded-lg border border-panel-border bg-black/20 p-4"
            role="status"
            aria-label={feedLabel}
          >
            <span className="sr-only">{feedLabel}</span>
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-9 animate-pulse rounded-lg bg-white/[0.06]" />
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-panel-border bg-black/20 p-3">
                  <div className="aspect-square animate-pulse rounded-md bg-white/[0.06]" />
                  <div className="mt-3 h-4 animate-pulse rounded bg-white/[0.08]" />
                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
