import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
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

  async getById(assetId: string, userId: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException({ code: "NOT_FOUND", message: "资产不存在。" });
    if (asset.userId !== userId) {
      throw new ForbiddenException({ code: "ASSET_NOT_OWNED", message: "无权访问该资产。" });
    }
    return asset;
  }

  /** Get a signed playback URL for an asset. */
  async getPlaybackUrl(assetId: string, userId: string): Promise<string> {
    const asset = await this.getById(assetId, userId);
    if (!asset.streamKey) {
      // Fallback: if storageKey is an external URL, return it directly
      if (asset.storageKey.startsWith("http")) {
        return asset.storageKey;
      }
      return this.media.getPlaybackUrl(asset.storageKey);
    }
    return this.media.getPlaybackUrl(asset.streamKey);
  }

  /** Get a signed download URL. */
  async getDownloadUrl(assetId: string, userId: string): Promise<string> {
    const asset = await this.getById(assetId, userId);
    return this.media.getPlaybackUrl(asset.storageKey, 600);
  }

  /** Delete a draft asset. */
  async delete(assetId: string, userId: string): Promise<void> {
    const asset = await this.getById(assetId, userId);
    if (asset.status !== "draft") {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "只能删除草稿资产。" });
    }
    await this.prisma.asset.delete({ where: { id: assetId } });
  }
}
