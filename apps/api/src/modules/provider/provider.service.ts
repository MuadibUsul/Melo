import { Injectable, Inject, Logger } from "@nestjs/common";
import {
  MiniMaxClient,
  type MiniMaxConfig,
  type GenerateMusicInput,
  type GenerateMusicResult,
} from "@music/sdk-minimax";
import type { AppEnv } from "@music/config";
import { APP_ENV } from "../../infra/config/config.module";

@Injectable()
export class ProviderService {
  readonly client: MiniMaxClient;
  private readonly logger = new Logger(ProviderService.name);

  constructor(@Inject(APP_ENV) env: AppEnv) {
    const apiKey = env.MINIMAX_API_KEY?.trim() || "MOCK_KEY";
    if (env.NODE_ENV === "production" && apiKey === "MOCK_KEY") {
      throw new Error("MINIMAX_API_KEY is required in production");
    }
    const config: MiniMaxConfig = {
      apiKey,
      baseUrl: env.MINIMAX_BASE_URL,
      groupId: env.MINIMAX_GROUP_ID,
      onUsage: (usage) => {
        this.logger.log(
          `MiniMax usage: model=${usage.model} kind=${usage.kind} units=${usage.units} trace=${usage.traceId}`,
        );
        // Phase 4: emit to telemetry/cost dashboard here.
      },
    };
    this.client = new MiniMaxClient(config);
  }

  async generateMusic(input: GenerateMusicInput): Promise<GenerateMusicResult> {
    return this.client.generateMusic(input);
  }

  async generateLyrics(prompt: string): Promise<{ title: string; lyrics: string; styleTags?: string }> {
    return this.client.generateLyrics({ prompt });
  }

  async textToSpeech(input: {
    text: string;
    voiceId: string;
    speed?: number;
    vol?: number;
    pitch?: number;
    emotion?: string;
    languageBoost?: string;
  }): Promise<{ audioBuffer: Buffer; traceId?: string }> {
    return this.client.textToSpeech(input);
  }
}
