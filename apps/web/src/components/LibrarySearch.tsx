"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LibrarySearch({
  initialQuery = "",
  actionPath = "/library",
}: {
  initialQuery?: string;
  actionPath?: "/library" | "/search";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `${actionPath}?q=${encodeURIComponent(value)}` : actionPath);
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2 sm:max-w-md">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜索歌曲、风格、歌单或创作者"
        aria-label="搜索 Melo 音乐库"
        className="h-10"
      />
      <Button type="submit" className="h-10">
        <Search className="size-4" />
        搜索
      </Button>
    </form>
  );
}
