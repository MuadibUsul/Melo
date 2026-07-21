import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { RedisService } from "../../infra/redis/redis.service";
import { ShowcaseCatalogService } from "../../common/showcase-catalog.service";

@Injectable()
export class ChartsService {
  private readonly logger = new Logger(ChartsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly showcase: ShowcaseCatalogService,
  ) {}

  // ── Real-time hot chart (Redis sorted set) ──

  async getHotChart(limit = 50) {
    if (!this.prisma.available || !this.redis.available) {
      return { items: this.showcase.getHotChart(limit) };
    }
    // Get top tracks by score from Redis sorted set
    const results = await this.redis.client.zrevrange("chart:hot", 0, limit - 1, "WITHSCORES");
    const ids: string[] = [];
    const scores: Record<string, number> = {};
    for (let i = 0; i < results.length; i += 2) {
      const id = results[i]!;
      ids.push(id);
      scores[id] = parseFloat(results[i + 1]!);
    }

    if (ids.length === 0) return { items: [] };

    const tracks = await this.prisma.track.findMany({
      where: { id: { in: ids }, status: "published" },
      include: { creator: { select: { id: true, displayName: true, avatarKey: true } } },
    });

    const items = tracks
      .map((t) => ({ ...t, score: scores[t.id] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .map((t, i) => ({ ...t, rank: i + 1 }));

    return { items };
  }

  // ── New chart (recently published) ──

  async getNewChart(limit = 50) {
    if (!this.prisma.available) {
      return { items: this.showcase.getNewChart(limit) };
    }
    const items = await this.prisma.track.findMany({
      where: { status: "published", visibility: "public" },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: { creator: { select: { id: true, displayName: true, avatarKey: true } } },
    });
    return { items: items.map((t, i) => ({ ...t, rank: i + 1, score: 0 })) };
  }

  // ── Genre chart ──

  async getGenreChart(genre: string, limit = 30) {
    if (!this.prisma.available) {
      return { items: this.showcase.getGenreChart(genre, limit) };
    }
    const items = await this.prisma.track.findMany({
      where: { status: "published", visibility: "public", genre },
      orderBy: { playCount: "desc" },
      take: limit,
      include: { creator: { select: { id: true, displayName: true, avatarKey: true } } },
    });
    return { items: items.map((t, i) => ({ ...t, rank: i + 1, score: t.playCount })) };
  }

  async getCreatorChart(limit = 20) {
    if (!this.prisma.available) {
      return { items: this.showcase.getCreatorChart(limit) };
    }
    const creators = await this.prisma.track.groupBy({
      by: ["creatorId"],
      where: { status: "published", visibility: "public" },
      _sum: { playCount: true, likeCount: true },
      _count: { _all: true },
      orderBy: { _sum: { playCount: "desc" } },
      take: limit,
    });
    const creatorIds = creators.map((item) => item.creatorId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, displayName: true, avatarKey: true },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));
    return {
      items: creators.map((item, index) => ({
        rank: index + 1,
        creatorId: item.creatorId,
        creator: userMap.get(item.creatorId) ?? { id: item.creatorId, displayName: "创作者", avatarKey: null },
        trackCount: item._count._all,
        playCount: item._sum.playCount ?? 0,
        likeCount: item._sum.likeCount ?? 0,
        score: (item._sum.playCount ?? 0) + (item._sum.likeCount ?? 0) * 2,
      })),
    };
  }

  // ── Generate chart snapshots (cron job) ──

  async generateChartSnapshot(type: string, period: string) {
    const entries = await this.getHotChart(100);
    const chart = await this.prisma.chart.create({
      data: {
        type,
        period,
        entries: {
          create: entries.items.map((e, i) => ({
            trackId: e.id,
            rank: i + 1,
            score: e.score,
          })),
        },
      },
    });
    this.logger.log(`Chart snapshot ${type}/${period} created with ${entries.items.length} entries`);
    return chart;
  }

  // ── Time-decay for hot chart (cron job) ──

  async applyDecay(decayFactor = 0.9) {
    // Apply decay to all entries in the hot chart sorted set
    const all = await this.redis.client.zrange("chart:hot", 0, -1, "WITHSCORES");
    const multi = this.redis.client.multi();
    for (let i = 0; i < all.length; i += 2) {
      const id = all[i]!;
      const score = parseFloat(all[i + 1]!);
      const newScore = score * decayFactor;
      if (newScore < 0.1) {
        multi.zrem("chart:hot", id);
      } else {
        multi.zadd("chart:hot", newScore, id);
      }
    }
    await multi.exec();
    this.logger.log(`Applied decay factor ${decayFactor} to chart:hot`);
  }
}
