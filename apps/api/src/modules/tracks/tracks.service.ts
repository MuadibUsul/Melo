import { Injectable, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { RedisService } from "../../infra/redis/redis.service";
import { ShowcaseCatalogService } from "../../common/showcase-catalog.service";
import { MediaService } from "../media/media.service";

@Injectable()
export class TracksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly redis: RedisService,
    private readonly showcase: ShowcaseCatalogService,
  ) {}

  // ── Publish draft → Track ──

  async publish(
    userId: string,
    assetId: string,
    meta: { title: string; description?: string; lyrics?: string; coverFile?: Buffer; coverContentType?: string; genre?: string; tags?: string[]; language?: string; visibility?: string },
  ): Promise<{ trackId: string }> {
    // Verify asset ownership and status
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException({ code: "NOT_FOUND", message: "资产不存在。" });
    if (asset.userId !== userId) throw new ForbiddenException({ code: "ASSET_NOT_OWNED", message: "无权操作该资产。" });
    if (asset.status !== "draft") throw new ConflictException({ code: "CONFLICT", message: "该资产已发布。" });

    // Upload cover if provided
    let coverKey: string | undefined;
    if (meta.coverFile && meta.coverContentType) {
      coverKey = await this.media.uploadCover(userId, assetId, meta.coverFile, meta.coverContentType);
    }

    // Create track (pending_review by default — moderation module will handle)
    const track = await this.prisma.track.create({
      data: {
        assetId,
        creatorId: userId,
        title: meta.title,
        description: meta.description ?? null,
        lyrics: meta.lyrics ?? null,
        coverKey: coverKey ?? null,
        genre: meta.genre ?? null,
        tags: meta.tags ?? [],
        language: meta.language ?? null,
        visibility: meta.visibility ?? "public",
        isAiGenerated: true, // Compliance: always true per plan §4
        status: "pending_review",
      },
    });

    // Mark asset as published
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { status: "published" },
    });

    // Auto-pre-screen for moderation (if moderation module is wired)
    // For now, auto-approve straightforward content
    await this.autoModerate(track.id);

    return { trackId: track.id };
  }

  private async autoModerate(trackId: string): Promise<void> {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) return;

    // Simple auto-pre-screen: check lyrics for basic violations
    let autoFlags: Record<string, unknown> | null = null;
    const flags: string[] = [];

    if (track.lyrics) {
      const l = track.lyrics.toLowerCase();
      if (l.length < 10) flags.push("lyrics_too_short");
    }
    if (!track.title || track.title.length < 2) flags.push("title_too_short");

    if (flags.length > 0) {
      autoFlags = { flags, severity: "low" };
    }

    if (autoFlags) {
      await this.prisma.moderationCase.create({
        data: {
          targetType: "track",
          targetId: trackId,
          status: "pending",
          reason: flags.join(", "),
          autoFlags: autoFlags as Prisma.InputJsonValue,
        },
      });
    } else {
      // Auto-approve clean content
      await this.prisma.track.update({
        where: { id: trackId },
        data: { status: "published", publishedAt: new Date() },
      });
      // Newly published songs enter the site ranking with a small starting score.
      await this.redis.client.zadd("chart:hot", 1, trackId);
    }
  }

  // ── Catalog ──

  async listPublished(page = 1, pageSize = 20, genre?: string) {
    if (!this.prisma.available) {
      const all = genre ? this.showcase.getTracks().filter((track) => track.genre === genre) : this.showcase.getTracks();
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize).map((track) => ({
        ...track,
        creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
      }));
      return { items, total: all.length };
    }
    const where: Prisma.TrackWhereInput = { status: "published", visibility: "public" };
    if (genre) where.genre = genre;

    const [items, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { creator: { select: { id: true, displayName: true, avatarKey: true } } },
      }),
      this.prisma.track.count({ where }),
    ]);
    return { items, total };
  }

  async getById(trackId: string) {
    if (!this.prisma.available) {
      const track = this.showcase.getTrack(trackId);
      if (!track) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "作品不存在或未发布。" });
      }
      return {
        ...track,
        creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
        asset: { id: `asset-${track.id}`, storageKey: track.audioUrl, streamKey: track.audioUrl, durationMs: track.durationMs, format: "mp3" },
      };
    }
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: {
        creator: { select: { id: true, displayName: true, avatarKey: true } },
        asset: { select: { id: true, storageKey: true, streamKey: true, durationMs: true, format: true } },
      },
    });
    if (!track || track.status !== "published") {
      throw new NotFoundException({ code: "NOT_FOUND", message: "作品不存在或未发布。" });
    }
    return track;
  }

  /** Get a signed playback URL for a track. */
  async getPlaybackUrl(trackId: string): Promise<string> {
    const track = await this.getById(trackId);
    const key = track.asset.streamKey || track.asset.storageKey;
    if (key.startsWith("http")) return key;
    return this.media.getPlaybackUrl(key);
  }

  // ── Creator management ──

  async listByCreator(creatorId: string, page = 1, pageSize = 20) {
    if (!this.prisma.available) {
      const all = this.showcase.getTracksByCreator(creatorId).items;
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize).map((track) => ({
        ...track,
        creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
      }));
      return { items, total: all.length };
    }
    const [items, total] = await Promise.all([
      this.prisma.track.findMany({
        where: { creatorId, status: "published", visibility: "public" },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { creator: { select: { id: true, displayName: true, avatarKey: true } } },
      }),
      this.prisma.track.count({ where: { creatorId, status: "published", visibility: "public" } }),
    ]);
    return { items, total };
  }

  // ── Search (PG full-text search) ──

  async search(q: string, page = 1, pageSize = 20) {
    if (!this.prisma.available) {
      const all = this.showcase.search(q);
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize).map((track) => ({
        ...track,
        creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
      }));
      return { items, total: all.length };
    }
    // PostgreSQL ILIKE for basic search (PG FTS can be added with tsvector in migration)
    const where = {
      status: "published" as const,
      visibility: "public" as const,
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { creator: { displayName: { contains: q, mode: "insensitive" as const } } },
        { tags: { hasSome: [q] } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { creator: { select: { id: true, displayName: true, avatarKey: true } } },
      }),
      this.prisma.track.count({ where }),
    ]);
    return { items, total };
  }
}
