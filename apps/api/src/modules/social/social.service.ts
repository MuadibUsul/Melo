import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { RedisService } from "../../infra/redis/redis.service";
import { ShowcaseCatalogService } from "../../common/showcase-catalog.service";

@Injectable()
export class SocialService {
  private readonly memoryRecentByDevice = new Map<string, Array<{ trackId: string; playedAt: string }>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly showcase: ShowcaseCatalogService,
  ) {}

  async like(userId: string, trackId: string): Promise<{ liked: boolean }> {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "\u4f5c\u54c1\u4e0d\u5b58\u5728\u3002" });
    }

    const existing = await this.prisma.like.findUnique({
      where: { userId_trackId: { userId, trackId } },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { userId_trackId: { userId, trackId } } });
      await this.prisma.track.update({ where: { id: trackId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false };
    }

    await this.prisma.like.create({ data: { userId, trackId } });
    await this.prisma.track.update({ where: { id: trackId }, data: { likeCount: { increment: 1 } } });
    return { liked: true };
  }

  async isLiked(userId: string, trackId: string): Promise<boolean> {
    const existing = await this.prisma.like.findUnique({
      where: { userId_trackId: { userId, trackId } },
    });
    return !!existing;
  }

  async follow(followerId: string, creatorId: string): Promise<{ following: boolean }> {
    if (followerId === creatorId) {
      throw new ConflictException({ code: "CONFLICT", message: "\u4e0d\u80fd\u5173\u6ce8\u81ea\u5df1\u3002" });
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_creatorId: { followerId, creatorId } },
    });

    if (existing) {
      await this.prisma.follow.delete({ where: { followerId_creatorId: { followerId, creatorId } } });
      return { following: false };
    }

    await this.prisma.follow.create({ data: { followerId, creatorId } });
    return { following: true };
  }

  async createPlaylist(userId: string, title: string, isPublic = true) {
    const normalizedTitle = title?.trim();
    if (!normalizedTitle) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "\u6b4c\u5355\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a\u3002",
      });
    }
    const playlist = await this.prisma.playlist.create({
      data: { ownerId: userId, title: normalizedTitle.slice(0, 60), isPublic },
    });
    await this.writeAudit(userId, "playlist.create", "playlist", playlist.id);
    return playlist;
  }

  async addToPlaylist(playlistId: string, userId: string, trackId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "\u6b4c\u5355\u4e0d\u5b58\u5728\u3002" });
    }
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track || track.status !== "published") {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "\u4f5c\u54c1\u4e0d\u5b58\u5728\u6216\u672a\u53d1\u5e03\u3002",
      });
    }

    const count = await this.prisma.playlistTrack.count({ where: { playlistId } });
    await this.prisma.playlistTrack.upsert({
      where: { playlistId_trackId: { playlistId, trackId } },
      create: { playlistId, trackId, position: count },
      update: {},
    });
    await this.writeAudit(userId, "playlist.track.add", "track", trackId, { playlistId });
    return { ok: true };
  }

  async removeFromPlaylist(playlistId: string, userId: string, trackId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "\u6b4c\u5355\u4e0d\u5b58\u5728\u3002" });
    }
    await this.prisma.playlistTrack
      .delete({ where: { playlistId_trackId: { playlistId, trackId } } })
      .catch(() => null);
    await this.writeAudit(userId, "playlist.track.remove", "track", trackId, { playlistId });
    return { ok: true };
  }

  async getPlaylists(userId: string) {
    return this.prisma.playlist.findMany({
      where: { ownerId: userId },
      include: { tracks: { include: { track: true }, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPublicPlaylist(playlistId: string) {
    if (!this.prisma.available) {
      const playlist = this.showcase.getPlaylist(playlistId);
      if (!playlist) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "歌单不存在。" });
      }
      return playlist;
    }
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, isPublic: true },
      include: {
        owner: { select: { id: true, displayName: true } },
        tracks: {
          orderBy: { position: "asc" },
          include: {
            track: {
              include: {
                creator: { select: { id: true, displayName: true, avatarKey: true } },
                asset: {
                  select: { id: true, storageKey: true, streamKey: true, durationMs: true, format: true },
                },
              },
            },
          },
        },
      },
    });
    if (!playlist) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "\u6b4c\u5355\u4e0d\u5b58\u5728\u3002" });
    }
    return playlist;
  }

  async listPublicPlaylists() {
    if (!this.prisma.available) {
      return { items: this.showcase.listPublicPlaylists() };
    }

    const items = await this.prisma.playlist.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        owner: { select: { id: true, displayName: true } },
        tracks: {
          orderBy: { position: "asc" },
          include: {
            track: {
              include: {
                creator: { select: { id: true, displayName: true, avatarKey: true } },
                asset: {
                  select: { id: true, storageKey: true, streamKey: true, durationMs: true, format: true },
                },
              },
            },
          },
        },
      },
    });

    return { items };
  }

  async getRecentTracks(deviceId?: string, limit = 6) {
    if (!deviceId) return { items: [] };

    if (!this.prisma.available) {
      const recent = this.memoryRecentByDevice.get(deviceId) ?? [];
      const ids = recent.slice(0, limit).map((item) => item.trackId);
      const items = ids
        .map((id) => this.showcase.getTrack(id))
        .filter(Boolean)
        .map((track) => ({
          id: track!.id,
          title: track!.title,
          genre: track!.genre,
          playCount: track!.playCount,
          likeCount: track!.likeCount,
          creator: {
            id: track!.creator.id,
            displayName: track!.creator.displayName,
            avatarKey: null,
          },
          asset: {
            id: `asset-${track!.id}`,
            storageKey: track!.audioUrl,
            streamKey: track!.audioUrl,
            durationMs: track!.durationMs,
            format: "mp3",
          },
        }));
      return { items };
    }

    const events = await this.prisma.playEvent.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { trackId: true, createdAt: true },
    });

    const orderedTrackIds = Array.from(
      new Map(events.map((event) => [event.trackId, event.createdAt.toISOString()])).keys(),
    ).slice(0, limit);

    if (orderedTrackIds.length === 0) return { items: [] };

    const tracks = await this.prisma.track.findMany({
      where: { id: { in: orderedTrackIds }, status: "published" },
      include: {
        creator: { select: { id: true, displayName: true, avatarKey: true } },
        asset: {
          select: { id: true, storageKey: true, streamKey: true, durationMs: true, format: true },
        },
      },
    });

    const trackMap = new Map(tracks.map((track) => [track.id, track]));
    return {
      items: orderedTrackIds.map((id) => trackMap.get(id)).filter(Boolean),
    };
  }

  async recordPlay(
    trackId: string,
    userId?: string,
    deviceId?: string,
    msPlayed = 0,
    completed = false,
    source = "web",
  ) {
    if (msPlayed < 3000 && !completed) return;

    if (deviceId) {
      this.rememberRecentPlay(deviceId, trackId);
    }

    if (!this.prisma.available) return;

    const dedupId = userId ?? deviceId;
    if (dedupId && this.redis.available) {
      const dupKey = `play:dedup:${dedupId}:${trackId}`;
      const exists = await this.redis.client.get(dupKey);
      if (exists) return;
      await this.redis.client.setex(dupKey, 30, "1");
    }

    await this.prisma.playEvent.create({
      data: { trackId, userId: userId ?? null, deviceId: deviceId ?? null, msPlayed, completed, source },
    });

    await this.prisma.track.update({
      where: { id: trackId },
      data: { playCount: { increment: 1 } },
    });

    if (this.redis.available) {
      await this.redis.client.zincrby("chart:hot", 1, trackId);
    }
  }

  async addComment(trackId: string, userId: string, content: string, parentId?: string) {
    const text = content?.trim();
    if (!text) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "\u8bc4\u8bba\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a\u3002",
      });
    }
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track || track.status !== "published") {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "\u4f5c\u54c1\u4e0d\u5b58\u5728\u6216\u672a\u53d1\u5e03\u3002",
      });
    }

    const comment = await this.prisma.comment.create({
      data: { trackId, userId, content: text.slice(0, 500), parentId: parentId ?? null, status: "visible" },
    });
    await this.prisma.track.update({ where: { id: trackId }, data: { commentCount: { increment: 1 } } });
    return comment;
  }

  async getComments(trackId: string, page = 1, pageSize = 20) {
    if (!this.prisma.available) {
      return this.showcase.getComments(trackId);
    }
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { trackId, status: "visible", parentId: null },
        include: {
          user: { select: { id: true, displayName: true, avatarKey: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.comment.count({ where: { trackId, status: "visible", parentId: null } }),
    ]);

    return { items, total };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "\u8bc4\u8bba\u4e0d\u5b58\u5728\u3002" });
    }
    if (comment.userId !== userId) {
      throw new ConflictException({ code: "FORBIDDEN", message: "\u65e0\u6743\u5220\u9664\u8be5\u8bc4\u8bba\u3002" });
    }

    await this.prisma.comment.update({ where: { id: commentId }, data: { status: "removed" } });
    await this.prisma.track
      .update({ where: { id: comment.trackId }, data: { commentCount: { decrement: 1 } } })
      .catch(() => null);
    await this.writeAudit(userId, "comment.delete", "comment", commentId, { trackId: comment.trackId });
    return { ok: true };
  }

  async reportTrack(trackId: string, userId: string, reason: string) {
    const text = reason?.trim();
    if (!text) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "\u4e3e\u62a5\u539f\u56e0\u4e0d\u80fd\u4e3a\u7a7a\u3002",
      });
    }
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track || track.status !== "published") {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "\u4f5c\u54c1\u4e0d\u5b58\u5728\u6216\u672a\u53d1\u5e03\u3002",
      });
    }

    const modCase = await this.prisma.moderationCase.create({
      data: {
        targetType: "track",
        targetId: trackId,
        status: "pending",
        reason: text.slice(0, 300),
        autoFlags: { source: "user_report", reporterId: userId } as Prisma.InputJsonValue,
      },
    });
    await this.writeAudit(userId, "track.report", "track", trackId, { moderationCaseId: modCase.id });
    return { ok: true, caseId: modCase.id };
  }

  private async writeAudit(
    actorId: string | null,
    action: string,
    targetType: string,
    targetId: string,
    meta?: Record<string, unknown>,
  ) {
    await this.prisma.auditLog.create({
      data: { actorId, action, targetType, targetId, meta: meta ? (meta as Prisma.InputJsonValue) : undefined },
    });
  }

  private rememberRecentPlay(deviceId: string, trackId: string) {
    const current = this.memoryRecentByDevice.get(deviceId) ?? [];
    const next = [{ trackId, playedAt: new Date().toISOString() }, ...current.filter((item) => item.trackId !== trackId)]
      .slice(0, 12);
    this.memoryRecentByDevice.set(deviceId, next);
  }
}
