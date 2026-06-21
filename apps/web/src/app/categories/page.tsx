import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { TrackList } from "@/components/TrackList";

const genres = ["中文流行", "国风", "R&B", "电子", "Lo-fi", "纯音乐", "影视配乐", "游戏配乐"];

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const params = await searchParams;
  const active = params.genre ?? genres[0];

  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="分类" title={active} description="按风格和使用场景浏览曲库。">
        <section className="mb-6 overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(180deg,rgba(233,200,111,0.16),rgba(17,19,23,0.96)_44%)] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-studio-gold">分类</div>
          <h1 className="mt-3 text-4xl font-semibold">{active}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Link
                key={genre}
                href={`/categories?genre=${encodeURIComponent(genre)}`}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  genre === active
                    ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                    : "border-panel-border text-muted-foreground hover:border-studio-gold/45 hover:text-foreground"
                }`}
              >
                {genre}
              </Link>
            ))}
          </div>
        </section>
        <TrackList genre={active} />
      </StudioShell>
    </>
  );
}
