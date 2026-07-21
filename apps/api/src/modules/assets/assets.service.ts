import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { MediaService } from "../media/media.service";

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async list(userId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where: { userId, status: "draft" },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.asset.count({ where: { userId, status: "draft" } }),
    ]);
    return { items, total };
  }

  async prepareUpload(
    userId: string,
    input: { filename?: string; contentType?: string; sizeBytes?: number; usage?: string },
  ) {
    const contentType = input.contentType || "audio/mpeg";
    if (!/^audio\/(mpeg|mp3|wav|wave|x-wav|aac|m4a|mp4|ogg|webm)$/i.test(contentType)) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "仅支持常见音频格式。" });
    }
    if (input.sizeBytes && input.sizeBytes > 50 * 1024 * 1024) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "参考音频不能超过 50MB。" });
    }

    const prepared = await this.media.prepareAudioUpload(userId, contentType);
    const asset = await this.prisma.asset.create({
      data: {
        userId,
        type: input.usage === "voice_reference" ? "voice_reference" : "reference_audio",
        storageKey: prepared.storageKey,
        streamKey: prepared.storageKey,
        format: contentType,
        status: "draft",
      },
    });

    return {
      assetId: asset.id,
      storageKey: prepared.storageKey,
      uploadUrl: prepared.uploadUrl,
      expiresIn: prepared.expiresIn,
      method: "PUT",
      headers: { "Content-Type": contentType },
    };
  }

  async getById(assetId: string, userId: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException({ code: "NOT_FOUND", message: "资产不存在。" });
    if (asset.userId !== userId) {
      throw new ForbiddenException({ code: "ASSET_NOT_OWNED", message: "无权访问该资产。" });
    }
    return asset;
  }

  async getPlaybackUrl(assetId: string, userId: string): Promise<string> {
    const asset = await this.getById(assetId, userId);
    const key = asset.streamKey || asset.storageKey;
    if (key.startsWith("http")) return key;
    return this.media.getPlaybackUrl(key);
  }

  async getDownloadUrl(assetId: string, userId: string): Promise<string> {
    const asset = await this.getById(assetId, userId);
    if (asset.storageKey.startsWith("http")) return asset.storageKey;
    return this.media.getPlaybackUrl(asset.storageKey, 600);
  }

  async delete(assetId: string, userId: string): Promise<void> {
    const asset = await this.getById(assetId, userId);
    if (asset.status !== "draft") {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "只能删除草稿资产。" });
    }
    await this.prisma.asset.delete({ where: { id: assetId } });
  }
}
