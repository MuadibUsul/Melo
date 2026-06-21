import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../infra/prisma/prisma.service";
import { RedisService } from "../infra/redis/redis.service";

/**
 * Feature flag system (plan §5.6).
 * Flags stored in DB (AuditLog meta or a dedicated table) with Redis cache.
 * Hot-reload: flag changes take effect within 60s TTL.
 */

const FLAG_PREFIX = "ff:";

// Known feature flags with defaults
const DEFAULT_FLAGS: Record<string, boolean> = {
  pro_mode: true,
  voice_clone: false, // requires consent system (Phase 4)
  music_cover: true,
  commercial_use: true,
  ai_safety_filter: true,
  payment_real: false, // mock until real payment channel
  moderation_auto_approve: true,
};

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Check if a feature flag is enabled. */
  async isEnabled(flag: string): Promise<boolean> {
    const key = FLAG_PREFIX + flag;
    const cached = await this.redis.client.get(key);
    if (cached !== null) return cached === "1";

    // Fall back to DB (via AuditLog meta with action='feature_flag')
    const entry = await this.prisma.auditLog.findFirst({
      where: { action: "feature_flag", targetType: flag },
      orderBy: { createdAt: "desc" },
    });
    const value = entry?.meta && typeof entry.meta === "object" && "enabled" in entry.meta
      ? (entry.meta as { enabled: boolean }).enabled
      : DEFAULT_FLAGS[flag] ?? false;

    // Cache for 60s
    await this.redis.client.setex(key, 60, value ? "1" : "0");
    return value;
  }

  /** Set a feature flag (admin only). */
  async setFlag(flag: string, enabled: boolean, actorId?: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: "feature_flag",
        targetType: flag,
        actorId: actorId ?? null,
        meta: { enabled },
      },
    });
    await this.redis.client.del(FLAG_PREFIX + flag);
    this.logger.log(`Feature flag ${flag} = ${enabled}`);
  }

  /** Get all flags with current values. */
  async getAll(): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    for (const flag of Object.keys(DEFAULT_FLAGS)) {
      result[flag] = await this.isEnabled(flag);
    }
    return result;
  }
}
