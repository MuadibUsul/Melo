import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  available = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.available = true;
    } catch {
      this.available = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Lightweight liveness probe for the health endpoint. */
  async ping(): Promise<boolean> {
    if (!this.available) return false;
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
