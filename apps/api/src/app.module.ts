import { Module, type NestModule, type MiddlewareConsumer } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { BullModule } from "@nestjs/bullmq";
import { FeatureFlagsService } from "./common/feature-flags.service";
import { SecurityMiddleware } from "./common/security.middleware";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { EntitlementModule } from "./modules/entitlement/entitlement.module";
import { ProviderModule } from "./modules/provider/provider.module";
import { MediaModule } from "./modules/media/media.module";
import { GenerationModule } from "./modules/generation/generation.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { TracksModule } from "./modules/tracks/tracks.module";
import { SocialModule } from "./modules/social/social.module";
import { BillingModule } from "./modules/billing/billing.module";
import { ChartsModule } from "./modules/charts/charts.module";
import { PresetsModule } from "./modules/presets/presets.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AppConfigModule } from "./infra/config/config.module";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { RedisModule } from "./infra/redis/redis.module";
import { StorageModule } from "./infra/storage/storage.module";
import { ShowcaseCatalogModule } from "./common/showcase-catalog.module";

const backgroundEnabled = process.env.ENABLE_BACKGROUND === "1";

@Module({
  imports: [
    AppConfigModule,
    ShowcaseCatalogModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        redact: ["req.headers.authorization", "req.headers.cookie"],
        transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty", options: { singleLine: true } },
      },
    }),
    ...(backgroundEnabled ? [BullModule.forRoot({ connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" } })] : []),
    PrismaModule, RedisModule, StorageModule,
    AuthModule, EntitlementModule, ProviderModule, MediaModule,
    ...(backgroundEnabled ? [GenerationModule, RealtimeModule] : []),
    AssetsModule, TracksModule,
    SocialModule, BillingModule, ChartsModule, PresetsModule,
    AdminModule, HealthModule,
  ],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityMiddleware).forRoutes("*");
  }
}
