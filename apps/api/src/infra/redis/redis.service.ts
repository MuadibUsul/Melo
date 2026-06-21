import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import type { AppEnv } from "@music/config";
import { APP_ENV } from "../config/config.module";

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  available = false;

  constructor(@Inject(APP_ENV) env: AppEnv) {
    this.client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
    this.client.on("error", () => {
      this.available = false;
    });
    this.client.connect().then(() => {
      this.available = true;
    }).catch(() => {
      this.available = false;
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }

  async ping(): Promise<boolean> {
    if (!this.available) return false;
    try {
      return (await this.client.ping()) === "PONG";
    } catch {
      return false;
    }
  }
}
