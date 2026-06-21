import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BillingService } from "./billing.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { rateLimit } from "../../common/rate-limit.guard";

@ApiTags("billing")
@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("plans")
  async getPlans() {
    return this.billing.getPlans();
  }

  @Get("subscription")
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser() user: JwtPayload) {
    return this.billing.getSubscription(user.sub);
  }

  @Post("subscription/create")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 300, maxRequests: 6, keyPrefix: "subscription-create" }))
  async create(@CurrentUser() user: JwtPayload, @Body() body: { planCode: string; provider?: string }) {
    return this.billing.createSubscription(user.sub, body.planCode, body.provider);
  }

  @Post("subscription/cancel")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 300, maxRequests: 6, keyPrefix: "subscription-cancel" }))
  async cancel(@CurrentUser() user: JwtPayload) {
    return this.billing.cancelSubscription(user.sub);
  }

  @Post("webhooks/payment")
  @UseGuards(rateLimit({ windowSec: 60, maxRequests: 120, keyPrefix: "payment-webhook" }))
  async webhook(@Body() body: { provider: string; eventId: string; payload: unknown }) {
    return this.billing.handleWebhook(body.provider, body.eventId, body.payload);
  }
}
