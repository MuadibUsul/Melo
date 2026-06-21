import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AdminController } from "./admin.controller";
import { FeatureFlagsController } from "./feature-flags.controller";
import { AdminService } from "./admin.service";
import { CronService } from "./cron.service";
import { FeatureFlagsService } from "../../common/feature-flags.service";
import { EntitlementModule } from "../entitlement/entitlement.module";
import { ChartsModule } from "../charts/charts.module";
import { BillingModule } from "../billing/billing.module";
import { PresetsModule } from "../presets/presets.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EntitlementModule,
    ChartsModule,
    BillingModule,
    PresetsModule,
  ],
  controllers: [AdminController, FeatureFlagsController],
  providers: [AdminService, CronService, FeatureFlagsService],
  exports: [AdminService],
})
export class AdminModule {}
