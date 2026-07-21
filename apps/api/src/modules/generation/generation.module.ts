import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { GenerationController } from "./generation.controller";
import { VersionController } from "./version.controller";
import { GenerationService } from "./generation.service";
import { VersionService } from "./version.service";
import { EntitlementModule } from "../entitlement/entitlement.module";
import { ProviderModule } from "../provider/provider.module";
import { MediaModule } from "../media/media.module";

const backgroundEnabled = process.env.ENABLE_BACKGROUND === "1";

@Module({
  imports: [
    ...(backgroundEnabled ? [BullModule.registerQueue({ name: "generation" })] : []),
    EntitlementModule,
    ProviderModule,
    MediaModule,
  ],
  controllers: [GenerationController, VersionController],
  providers: [GenerationService, VersionService],
  exports: [GenerationService, VersionService],
})
export class GenerationModule {}
