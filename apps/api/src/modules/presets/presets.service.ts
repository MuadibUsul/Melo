import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class PresetsService {
  constructor(private readonly prisma: PrismaService) {}

  async listOfficial(type?: string) {
    const where: Prisma.PresetWhereInput = { isOfficial: true, status: "active" };
    if (type) where.type = type;
    return this.prisma.preset.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async listUserPresets(userId: string) {
    return this.prisma.preset.findMany({
      where: { ownerId: userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
  }

  async savePreset(
    userId: string,
    data: { type: string; name: string; category?: string; params: Record<string, unknown> },
  ) {
    return this.prisma.preset.create({
      data: {
        type: data.type,
        name: data.name,
        category: data.category ?? null,
        params: data.params as Prisma.InputJsonValue,
        isOfficial: false,
        ownerId: userId,
      },
    });
  }

  async deletePreset(presetId: string, userId: string) {
    const preset = await this.prisma.preset.findUnique({ where: { id: presetId } });
    if (!preset) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "\u9884\u8bbe\u4e0d\u5b58\u5728\u3002" });
    }
    if (preset.ownerId !== userId) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "\u65e0\u6743\u64cd\u4f5c\u8be5\u9884\u8bbe\u3002" });
    }
    await this.prisma.preset.update({ where: { id: presetId }, data: { status: "inactive" } });
    return { ok: true };
  }

  async seedOfficialPresets() {
    const presets = [
      {
        type: "music_style",
        name: "\u4e2d\u6587\u6d41\u884c Pop",
        category: "\u98ce\u683c",
        params: {
          genre: "\u4e2d\u6587\u6d41\u884c",
          mood: "\u6e29\u6696",
          vocal: "\u7537\u5973\u5bf9\u5531",
          durationPreset: "60 \u79d2",
        },
      },
      {
        type: "music_style",
        name: "\u53e4\u98ce\u56fd\u98ce",
        category: "\u98ce\u683c",
        params: {
          genre: "\u56fd\u98ce",
          mood: "\u60a0\u8fdc",
          vocal: "\u5973\u58f0",
          durationPreset: "90 \u79d2\u6807\u51c6",
        },
      },
      {
        type: "music_style",
        name: "\u90fd\u5e02 R&B",
        category: "\u98ce\u683c",
        params: {
          genre: "R&B",
          mood: "\u6027\u611f",
          vocal: "\u7537\u58f0",
          durationPreset: "60 \u79d2",
        },
      },
      {
        type: "mood",
        name: "\u6e05\u6668\u901a\u52e4",
        category: "\u60c5\u7eea",
        params: {
          genre: "\u72ec\u7acb\u6c11\u8c23",
          mood: "\u8f7b\u5feb",
          vocal: "\u65e0\u4eba\u58f0",
          durationPreset: "90 \u79d2\u6807\u51c6",
        },
      },
      {
        type: "mood",
        name: "\u6df1\u591c\u72ec\u5904",
        category: "\u60c5\u7eea",
        params: {
          genre: "\u6c1b\u56f4\u7535\u5b50",
          mood: "\u5b64\u72ec",
          vocal: "\u65e0\u4eba\u58f0",
          durationPreset: "120 \u79d2\u5b8c\u6574",
        },
      },
      {
        type: "tts",
        name: "\u6e29\u67d4\u5973\u58f0\u64ad\u5ba2",
        category: "TTS",
        params: { voiceId: "female-sweet", speed: 0.9, emotion: "calm" },
      },
      {
        type: "tts",
        name: "\u6fc0\u6602\u7537\u58f0\u89e3\u8bf4",
        category: "TTS",
        params: { voiceId: "male-bold", speed: 1.1, emotion: "happy" },
      },
      {
        type: "lyrics_template",
        name: "Verse-Chorus \u6807\u51c6",
        category: "\u6b4c\u8bcd\u6a21\u677f",
        params: { structure: ["verse", "chorus", "verse", "chorus", "bridge", "chorus"] },
      },
    ];

    for (const p of presets) {
      await this.prisma.preset.upsert({
        where: { id: `official_${p.type}_${p.name}` },
        create: { id: `official_${p.type}_${p.name}`, ...p, isOfficial: true },
        update: p,
      });
    }
  }

  async listVoices(language?: string, gender?: string) {
    const where: Prisma.VoiceWhereInput = {};
    if (language) where.language = language;
    if (gender) where.gender = gender;
    return this.prisma.voice.findMany({ where, orderBy: { name: "asc" } });
  }

  async seedVoices() {
    const voices = [
      {
        providerVoiceId: "female-sweet",
        name: "\u751c\u7f8e\u5973\u58f0",
        language: "zh",
        gender: "female",
        tags: ["\u64ad\u5ba2", "\u6709\u58f0\u4e66"],
        isClonable: false,
      },
      {
        providerVoiceId: "male-bold",
        name: "\u6d51\u539a\u7537\u58f0",
        language: "zh",
        gender: "male",
        tags: ["\u89e3\u8bf4", "\u5e7f\u544a"],
        isClonable: false,
      },
      {
        providerVoiceId: "female-calm",
        name: "\u6e29\u67d4\u5973\u58f0",
        language: "zh",
        gender: "female",
        tags: ["\u51a5\u60f3", "\u52a9\u7720"],
        isClonable: false,
      },
      {
        providerVoiceId: "male-young",
        name: "\u9752\u5e74\u7537\u58f0",
        language: "zh",
        gender: "male",
        tags: ["\u914d\u97f3", "Vlog"],
        isClonable: false,
      },
    ];

    for (const v of voices) {
      await this.prisma.voice.upsert({
        where: { providerVoiceId: v.providerVoiceId },
        create: v,
        update: v,
      });
    }
  }
}
