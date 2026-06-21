import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { RedisService } from "../infra/redis/redis.service";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly memoryWindows = new Map<string, { count: number; expiresAt: number }>();

  constructor(
    private readonly redis: RedisService,
    private readonly options: { windowSec?: number; maxRequests?: number; keyPrefix?: string } = {},
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { windowSec = 60, maxRequests = 30, keyPrefix = "rl" } = this.options;
    const req = context.switchToHttp().getRequest();
    const identifier = req.user?.sub ?? req.ip ?? "anonymous";
    const endpoint = req.route?.path ?? req.url ?? "unknown";
    const key = `${keyPrefix}:${identifier}:${endpoint}`;

    const current = this.redis.available ? await this.bumpRedisWindow(key, windowSec) : this.bumpMemoryWindow(key, windowSec);

    if (current > maxRequests) {
      throw new HttpException({ code: "RATE_LIMITED", message: "请求过于频繁，请稍后再试。" }, 429);
    }

    return true;
  }

  private async bumpRedisWindow(key: string, windowSec: number) {
    try {
      const current = await this.redis.client.incr(key);
      if (current === 1) {
        await this.redis.client.expire(key, windowSec);
      }
      return current;
    } catch {
      return this.bumpMemoryWindow(key, windowSec);
    }
  }

  private bumpMemoryWindow(key: string, windowSec: number) {
    const now = Date.now();
    const existing = RateLimitGuard.memoryWindows.get(key);

    if (!existing || existing.expiresAt <= now) {
      RateLimitGuard.memoryWindows.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
      return 1;
    }

    existing.count += 1;
    return existing.count;
  }
}

export function rateLimit(opts: { windowSec?: number; maxRequests?: number; keyPrefix?: string } = {}) {
  @Injectable()
  class DynamicRateLimitGuard extends RateLimitGuard {
    constructor(redis: RedisService) {
      super(redis, opts);
    }
  }

  return DynamicRateLimitGuard;
}
