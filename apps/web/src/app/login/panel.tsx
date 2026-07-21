"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Disc3, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";

const benefits = [
  "保存生成草稿、项目版本和上传的参考音频",
  "管理创作额度、套餐权益和商用授权",
  "发布作品到 Melo 音乐库并参与榜单推荐",
];

function getSafeNextHref(nextHref?: string) {
  if (!nextHref || !nextHref.startsWith("/") || nextHref.startsWith("//")) return "/studio";
  return nextHref;
}

export function LoginPanel({ nextHref }: { nextHref?: string }) {
  const router = useRouter();
  const auth = useAuth();
  const safeNextHref = getSafeNextHref(nextHref);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("creator@music.local");
  const [displayName, setDisplayName] = useState("Melo 创作者");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await auth.login(email, password);
      } else {
        await auth.register(email, password, displayName);
      }
      window.dispatchEvent(new Event("credits-updated"));
      router.push(safeNextHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "login" ? "登录失败" : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px]">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-studio-gold/10 px-3 py-1 text-xs text-studio-gold">
          <Disc3 className="size-3.5" />
          Melo 账号
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          登录后，把灵感、草稿和发布记录都留在你的音乐库里
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Melo 的发现页可以直接开始创作；账号会把额度、草稿、项目版本、喜欢的歌曲和发布作品连成一个完整工作流。
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {benefits.map((item) => (
            <div key={item} className="rounded-lg border border-panel-border bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
              <CheckCircle2 className="mb-3 size-4 text-meter-green" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="studio-surface space-y-4 rounded-lg p-6">
        <div>
          <div className="flex rounded-lg border border-panel-border bg-black/20 p-1">
            {[
              { key: "login" as const, label: "登录" },
              { key: "register" as const, label: "注册" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key)}
                className={`h-9 flex-1 rounded-md text-sm transition ${
                  mode === item.key ? "bg-studio-gold text-black" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <h2 className="mt-5 text-2xl font-semibold">{mode === "login" ? "欢迎回来" : "创建 Melo 账号"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "使用本地演示账号或你的账号继续创作。" : "注册后即可保存草稿、额度和发布记录。"}
          </p>
        </div>

        {mode === "register" ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">显示名称</span>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="pl-9"
                placeholder="你的创作者名称"
              />
            </div>
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">邮箱</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-9"
              placeholder="creator@music.local"
              autoComplete="email"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">密码</span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pl-9"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
        </label>

        <div className="rounded-lg border border-panel-border bg-black/20 p-3 text-xs leading-5 text-muted-foreground">
          本地演示账号：`creator@music.local` / `demo123`。如果后端未启动，会显示服务暂不可用。
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        <Button className="h-10 w-full" disabled={loading}>
          <Sparkles className="size-4" />
          {loading ? (mode === "login" ? "登录中..." : "注册中...") : mode === "login" ? "登录并进入创作台" : "注册并进入创作台"}
        </Button>

        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <Link href="/discover" className="hover:text-foreground">
            先逛发现页
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            查看套餐
          </Link>
          <Link href={safeNextHref} className="hover:text-foreground">
            继续创作
          </Link>
        </div>
      </form>
    </section>
  );
}
