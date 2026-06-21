export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt : "中文流行";
  return Response.json({
    ok: true,
    data: {
      lyrics: `[Verse]\n${prompt}\n灯火落在窗边，旋律慢慢浮现\n\n[Chorus]\n把这一刻唱成歌，穿过城市夜色`,
    },
  });
}
