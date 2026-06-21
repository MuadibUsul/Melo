import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { ConsentService } from "./consent.service";
import { PaymentAdapterService } from "./payment-adapter.service";
import { EntitlementModule } from "../entitlement/entitlement.module";

@Module({
  imports: [EntitlementModule],
  controllers: [BillingController],
  providers: [BillingService, ConsentService, PaymentAdapterService],
  exports: [BillingService, ConsentService, PaymentAdapterService],
})
export class BillingModule {}
