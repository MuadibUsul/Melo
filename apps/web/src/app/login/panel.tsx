"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";

export function LoginPanel() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("creator@music.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.login(email, password);
      window.dispatchEvent(new Event("credits-updated"));
      router.push("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u767b\u5f55\u5931\u8d25");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col justify-center px-4">
      <form onSubmit={submit} className="studio-surface space-y-4 rounded-lg p-6">
        <h1 className="text-2xl font-semibold">{"\u767b\u5f55"}</h1>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "\u767b\u5f55\u4e2d..." : "\u767b\u5f55"}
        </Button>
      </form>
    </section>
  );
}
