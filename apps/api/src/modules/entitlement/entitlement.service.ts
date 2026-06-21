import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { RedisService } from "../../infra/redis/redis.service";
import type { Plan } from "@prisma/client";

// ── Cost configuration (plan §1.3) ──
export const COST_TABLE = {
  music: 10, // per generation
  tts: 1, // per 1K characters (rounded up)
  voice_clone: 50,
} as const;

export function estimateCost(type: string, params: Record<string, unknown> = {}): number {
  switch (type) {
    case "music":
      return COST_TABLE.music;
    case "tts": {
      const text = (params.text as string | undefined) ?? "";
      const k = Math.max(1, Math.ceil(Buffer.byteLength(text, "utf-8") / 1000));
      return k * COST_TABLE.tts;
    }
    case "voice_clone":
      return COST_TABLE.voice_clone;
    default:
      return 0;
  }
}

// ── Redis key helpers ──
const BALANCE_KEY = (userId: string) => `credit:balance:${userId}`;
const HOLD_PREFIX = "credit:hold:";

// ── Lua: atomic hold check & decrement ──
const HOLD_SCRIPT = `
local balanceKey = KEYS[1]
local holdKey = KEYS[2]
local cost = tonumber(ARGV[1])
local holdId = ARGV[2]
local ttl = tonumber(ARGV[3])

local balance = tonumber(redis.call('GET', balanceKey) or '0')
if balance < cost then
  return 0
end
redis.call('DECRBY', balanceKey, cost)
redis.call('SETEX', holdKey, ttl, cost)
return 1
`;

const REFUND_SCRIPT = `
local balanceKey = KEYS[1]
local holdKey = KEYS[2]
local cost = redis.call('GET', holdKey)
if not cost then
  return 0
end
redis.call('INCRBY', balanceKey, cost)
redis.call('DEL', holdKey)
return cost
`;

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Balance ──

  /** Get current balance, syncing from Postgres if Redis is cold. */
  async getBalance(userId: string): Promise<number> {
    const cached = await this.redis.client.get(BALANCE_KEY(userId));
    if (cached !== null) return Number(cached);

    const balance = await this.computeBalance(userId);
    await this.redis.client.set(BALANCE_KEY(userId), balance);
    return balance;
  }

  private async computeBalance(userId: string): Promise<number> {
    const result = await this.prisma.creditLedger.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    return result._sum.amount ?? 0;
  }

  /** Warm up Redis balance from Postgres (used after grant/refund). */
  private async syncBalance(userId: string): Promise<void> {
    const balance = await this.computeBalance(userId);
    await this.redis.client.set(BALANCE_KEY(userId), balance);
  }

  // ── Hold / Commit / Refund ──

  /**
   * Atomically reserve `cost` credits. Returns a holdId that must be committed
   * or refunded. Returns null if insufficient balance.
   */
  async hold(
    userId: string,
    cost: number,
    refType: string,
    refId: string,
  ): Promise<string | null> {
    if (cost <= 0) return null; // free action — no hold needed

    const holdId = crypto.randomUUID();
    const holdKey = HOLD_PREFIX + holdId;
    const holdTtl = 3600; // auto-expire holds after 1h

    // Ensure Redis balance is warm
    await this.getBalance(userId);

    const result = (await this.redis.client.eval(
      HOLD_SCRIPT,
      2,
      BALANCE_KEY(userId),
      holdKey,
      cost,
      holdId,
      holdTtl,
    )) as number;

    if (result === 0) return null; // insufficient balance

    // Persist hold in append-only ledger
    await this.prisma.creditLedger.create({
      data: {
        userId,
        type: "hold",
        amount: -cost,
        reason: refType,
        refType,
        refId,
        holdId,
      },
    });

    return holdId;
  }

  /** Finalize a hold — deduct credits permanently. */
  async commit(holdId: string): Promise<{ userId: string; cost: number }> {
    const holdEntry = await this.prisma.creditLedger.findFirst({
      where: { holdId, type: "hold" },
    });
    if (!holdEntry) throw new Error(`Hold ${holdId} not found`);

    // Mark as committed with a commit entry
    await this.prisma.creditLedger.create({
      data: {
        userId: holdEntry.userId,
        type: "commit",
        amount: 0, // net zero (hold already subtracted)
        reason: holdEntry.reason,
        refType: holdEntry.refType,
        refId: holdEntry.refId,
        holdId,
      },
    });

    // Clean up Redis hold key (balance already decremented by hold)
    await this.redis.client.del(HOLD_PREFIX + holdId);

    return { userId: holdEntry.userId, cost: Math.abs(holdEntry.amount) };
  }

  /** Refund a held amount — credits are returned. */
  async refund(holdId: string): Promise<{ userId: string; cost: number }> {
    const holdEntry = await this.prisma.creditLedger.findFirst({
      where: { holdId, type: "hold" },
    });
    if (!holdEntry) throw new Error(`Hold ${holdId} not found`);

    // Check if already settled (commit/refund)
    const settled = await this.prisma.creditLedger.findFirst({
      where: { holdId, type: { in: ["commit", "refund"] } },
    });
    if (settled) {
      this.logger.warn(`Hold ${holdId} already settled — skipping refund`);
      return { userId: holdEntry.userId, cost: 0 };
    }

    const cost = Math.abs(holdEntry.amount);
    const holdKey = HOLD_PREFIX + holdId;

    // Refund in Redis (returns cost if hold existed, 0 otherwise)
    await this.redis.client.eval(REFUND_SCRIPT, 2, BALANCE_KEY(holdEntry.userId), holdKey);

    // Persist refund
    await this.prisma.creditLedger.create({
      data: {
        userId: holdEntry.userId,
        type: "refund",
        amount: cost, // positive = credit back
        reason: `refund:${holdEntry.reason}`,
        refType: holdEntry.refType,
        refId: holdEntry.refId,
        holdId,
      },
    });

    // Re-sync balance
    await this.syncBalance(holdEntry.userId);
    return { userId: holdEntry.userId, cost };
  }

  // ── Grant / Consume ──

  /** Grant credits (monthly reset, purchase, admin, etc.). */
  async grant(
    userId: string,
    amount: number,
    reason: string,
    refType?: string,
    refId?: string,
  ): Promise<void> {
    await this.prisma.creditLedger.create({
      data: {
        userId,
        type: "grant",
        amount,
        reason,
        refType,
        refId,
      },
    });
    await this.syncBalance(userId);
  }

  /** Direct consume (no hold/commit needed — e.g., penalty). */
  async consume(userId: string, amount: number, reason: string): Promise<void> {
    const cost = Math.abs(amount);
    const current = await this.getBalance(userId);
    if (current < cost) {
      throw new Error("ENTITLEMENT_INSUFFICIENT_CREDITS");
    }

    await this.prisma.creditLedger.create({
      data: {
        userId,
        type: "consume",
        amount: -cost,
        reason,
      },
    });
    await this.syncBalance(userId);
  }

  /** Grant monthly credits based on plan (called on registration & cron reset). */
  async grantMonthly(userId: string, plan: { monthlyCredits: number; code: string }): Promise<void> {
    await this.grant(userId, plan.monthlyCredits, "monthly_reset", "plan", plan.code);
    this.logger.log(`Granted ${plan.monthlyCredits} monthly credits to ${userId} (plan: ${plan.code})`);
  }

  // ── Free plan seed ──

  /** Ensure the free plan exists so registration can grant credits. */
  async ensureFreePlan(): Promise<Plan> {
    let plan = await this.prisma.plan.findUnique({ where: { code: "free" } });
    if (!plan) {
      plan = await this.prisma.plan.create({
        data: {
          code: "free",
          name: "免费版",
          priceCents: 0,
          currency: "CNY",
          interval: "none",
          monthlyCredits: 30,
          features: {
            proMode: false,
            voiceClone: false,
            maxConcurrent: 1,
            maxDurationSec: 120,
            commercial: false,
            watermarkFree: false,
            priorityQueue: false,
          },
        },
      });
      this.logger.log("Seeded free plan");
    }
    return plan;
  }
}
