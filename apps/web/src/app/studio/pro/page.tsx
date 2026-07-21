import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { StudioClientV3 } from "@/components/StudioClientV3";
import { StudioNav } from "@/components/StudioNav";
import type { ProModeParams, ProModeTab } from "@/components/ProModePanel";
import type { GenerateRequest } from "@/types/music";

function parseProTab(value: string | undefined): ProModeTab | undefined {
  return value === "structure" || value === "reference" || value === "advanced" ? value : undefined;
}

function parseReferenceAudioType(value: string | undefined): ProModeParams["referenceAudioType"] | undefined {
  return value === "melody" || value === "style" || value === "cover" ? value : undefined;
}

export default async function StudioProPage({
  searchParams,
}: {
  searchParams: Promise<{
    prompt?: string;
    genre?: string;
    vocal?: string;
    proTab?: string;
    referenceAudioType?: string;
    referenceAudioUrl?: string;
    lyricsPrompt?: string;
  }>;
}) {
  const params = await searchParams;
  const initial: Partial<GenerateRequest> = {
    ...(params.prompt ? { prompt: params.prompt } : {}),
    ...(params.genre ? { genre: params.genre } : {}),
    ...(params.vocal ? { vocal: params.vocal } : {}),
  };
  const lyricsPrompt = params.lyricsPrompt ?? params.prompt;
  const initialPro: Partial<ProModeParams> = {
    ...(lyricsPrompt
      ? {
          lyricsStructure: [
            { section: "intro", text: "" },
            { section: "verse", text: lyricsPrompt },
            { section: "chorus", text: "" },
            { section: "bridge", text: "" },
            { section: "outro", text: "" },
          ],
        }
      : {}),
    ...(params.referenceAudioUrl ? { referenceAudioUrl: params.referenceAudioUrl } : {}),
    ...(parseReferenceAudioType(params.referenceAudioType) ? { referenceAudioType: parseReferenceAudioType(params.referenceAudioType) } : {}),
  };
  const initialProTab = parseProTab(params.proTab);

  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="自定义"
        title="自定义创作"
        description="控制歌词结构、参考音频、声音细节和高级参数，制作更完整的作品。"
      >
        <StudioNav />
        <StudioClientV3
          initial={Object.keys(initial).length > 0 ? initial : undefined}
          initialMode="pro"
          initialPro={Object.keys(initialPro).length > 0 ? initialPro : undefined}
          initialProTab={initialProTab}
        />
      </StudioShell>
    </>
  );
}
