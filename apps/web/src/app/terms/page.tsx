import Link from "next/link";
import { ArrowRight, Download, FileCheck2, ScrollText, ShieldCheck } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { Button } from "@/components/ui/button";

const policies = [
  {
    id: "service",
    title: "服务条款",
    description: "账号、额度、订阅、生成任务和平台使用规则。",
  },
  {
    id: "copyright",
    title: "内容与版权",
    description: "创作来源、公开发布、商业使用、Remix 和投诉处理。",
  },
  {
    id: "privacy",
    title: "隐私与安全",
    description: "登录信息、上传音频、生成记录和偏好反馈的使用范围。",
  },
  {
    id: "community",
    title: "社区准则",
    description: "发现页、评论、挑战投稿和公开个人主页的行为边界。",
  },
];

export default function TermsPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell title="条款政策" className="melo-rail-offset melo-mobile-dock-offset" showHeader={false}>
        <section className="grid min-h-[390px] items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-panel-border bg-black/25 px-3 py-1 text-xs text-muted-foreground">
              <ScrollText className="size-3.5 text-studio-gold" />
              Terms & Policies
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Melo 条款、版权、隐私和社区政策
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              对齐目标站公开导航的 Terms & Policies。这里集中说明创作、发布、订阅、上传素材和社区互动的基本规则。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/pricing">
                  查看订阅规则
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">登录账号</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-panel-border bg-black/25 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-meter-green" />
              快速原则
            </div>
            {["尊重原创和授权素材", "上传参考音频前确认使用权", "公开作品可被他人发现和互动", "商业使用以当前套餐说明为准"].map((item) => (
              <div key={item} className="border-t border-panel-border py-3 text-sm text-muted-foreground first:border-t-0">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {policies.map((policy) => (
            <article id={policy.id} key={policy.title} className="scroll-mt-24 studio-surface rounded-lg p-5">
              <FileCheck2 className="mb-4 size-5 text-studio-gold" />
              <h2 className="text-lg font-semibold">{policy.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{policy.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-panel-border bg-black/20 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">需要留档？</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                可以把当前政策页作为团队创作、品牌发布和商业使用前的检查入口。
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/account">
                <Download className="size-4" />
                打开账号中心
              </Link>
            </Button>
          </div>
        </section>
      </StudioShell>
    </>
  );
}
