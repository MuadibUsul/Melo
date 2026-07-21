import { CreditCard, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { PricingPlans } from "@/components/PricingPlans";
import { StudioShell } from "@/components/StudioShell";

const benefits = [
  { title: "创作额度", description: "每月获得稳定额度，用于生成、延展、Remix 和高级编辑。", icon: Zap },
  { title: "商用授权", description: "付费方案支持公开发布、商业项目和品牌内容使用。", icon: ShieldCheck },
  { title: "高级能力", description: "解锁参考音频、结构化歌词、声音人设和优先队列。", icon: Sparkles },
];

export default function PricingPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="套餐"
        title="Melo 套餐"
        description="选择适合你的创作额度、商用授权、优先队列和高级创作能力。"
      >
        <section className="mb-6 overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.18),rgba(17,19,23,0.96)_48%,rgba(39,224,167,0.10))] p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-black/20 px-3 py-1 text-xs text-studio-gold">
                <CreditCard className="size-3.5" />
                Plans
              </div>
              <h1 className="mt-4 text-4xl font-semibold">从灵感到发布，按你的节奏升级</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                免费额度适合体验；专业方案适合持续生成、商用发布、参考音频和更高优先级的创作工作流。
              </p>
            </div>
            <div className="grid gap-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="rounded-lg border border-panel-border bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="size-4 text-studio-gold" />
                      {benefit.title}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <PricingPlans />
      </StudioShell>
    </>
  );
}
