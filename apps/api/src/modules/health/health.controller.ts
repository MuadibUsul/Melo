import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { hasMiniMaxEnv, loadEnv } from "@music/config";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { RedisService } from "../../infra/redis/redis.service";
import { StorageService } from "../../infra/storage/storage.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  async check() {
    const env = loadEnv();
    const [dbOk, redisOk, s3Ok] = await Promise.all([
      this.prisma.ping(),
      this.redis.ping(),
      this.storage.ping(),
    ]);
    const allOk = dbOk && redisOk && s3Ok;

    return {
      status: allOk ? "ok" : "degraded",
      service: "api",
      env: env.NODE_ENV,
      dependencies: {
        database: dbOk ? "ok" : "unavailable",
        redis: redisOk ? "ok" : "unavailable",
        objectStorage: s3Ok ? "ok" : "unavailable",
        minimax: hasMiniMaxEnv(env) ? "configured" : "mock",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
