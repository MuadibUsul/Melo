import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EntitlementService } from "../entitlement/entitlement.service";
import { PaymentAdapterService } from "./payment-adapter.service";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlement: EntitlementService,
    private readonly payments: PaymentAdapterService,
  ) {}

  async getPlans() {
    if (!this.prisma.available) {
      return [
        {
          code: "free",
          name: "免费版",
          priceCents: 0,
          currency: "CNY",
          interval: "none",
          monthlyCredits: 120,
          features: { proMode: false, voiceClone: false, maxConcurrent: 1, maxDurationSec: 120, commercial: false, watermarkFree: false, priorityQueue: false },
        },
        {
          code: "monthly",
          name: "专业版月付",
          priceCents: 3900,
          currency: "CNY",
          interval: "month",
          monthlyCredits: 2000,
          features: { proMode: true, voiceClone: true, maxConcurrent: 5, maxDurationSec: 300, commercial: true, watermarkFree: true, priorityQueue: false },
        },
        {
          code: "yearly",
          name: "专业版年付",
          priceCents: 39900,
          currency: "CNY",
          interval: "year",
          monthlyCredits: 3000,
          features: { proMode: true, voiceClone: true, maxConcurrent: 10, maxDurationSec: 300, commercial: true, watermarkFree: true, priorityQueue: true },
        },
      ];
    }
    const plans = await this.prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } });
    if (plans.length > 0) return plans;
    await this.seedDefaultPlans();
    return this.prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } });
  }

  async seedDefaultPlans() {
    const plans = [
      {
        code: "free",
        name: "免费版",
        priceCents: 0,
        currency: "CNY",
        interval: "none",
        monthlyCredits: 120,
        features: { proMode: false, voiceClone: false, maxConcurrent: 1, maxDurationSec: 120, commercial: false, watermarkFree: false, priorityQueue: false },
      },
      {
        code: "monthly",
        name: "专业版月付",
        priceCents: 3900,
        currency: "CNY",
        interval: "month",
        monthlyCredits: 2000,
        features: { proMode: true, voiceClone: true, maxConcurrent: 5, maxDurationSec: 300, commercial: true, watermarkFree: true, priorityQueue: false },
      },
      {
        code: "yearly",
        name: "专业版年付",
        priceCents: 39900,
        currency: "CNY",
        interval: "year",
        monthlyCredits: 3000,
        features: { proMode: true, voiceClone: true, maxConcurrent: 10, maxDurationSec: 300, commercial: true, watermarkFree: true, priorityQueue: true },
      },
    ];

    for (const plan of plans) {
      await this.prisma.plan.upsert({
        where: { code: plan.code },
        create: plan,
        update: { name: plan.name, monthlyCredits: plan.monthlyCredits, features: plan.features, priceCents: plan.priceCents, active: true },
      });
    }
    this.logger.log("Default billing plans are ready");
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ["trialing", "active", "past_due"] } },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, displayName: true } } },
    });
    if (!subscription) return null;
    const plan = await this.prisma.plan.findUnique({ where: { id: subscription.planId } });
    return { ...subscription, plan };
  }

  async createSubscription(userId: string, planCode: string, provider = "internal") {
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) throw new NotFoundException({ code: "NOT_FOUND", message: "套餐不存在。" });

    const existing = await this.getSubscription(userId);
    if (existing) throw new ConflictException({ code: "CONFLICT", message: "已有有效订阅，请先取消后再切换套餐。" });

    if (plan.priceCents > 0) {
      const intent = await this.payments.createPaymentIntent(userId, plan.code, plan.priceCents, plan.currency);
      const periodDays = plan.interval === "year" ? 365 : 30;
      const sub = await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "active",
          provider,
          providerSubId: intent.providerIntentId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 3600_000),
        },
      });

      await this.entitlement.grantMonthly(userId, plan);
      await this.prisma.user.update({ where: { id: userId }, data: { role: "PRO_USER" } });
      await this.writeAudit(userId, "subscription.create", "subscription", sub.id, { planCode, provider });

      return { subscriptionId: sub.id, status: sub.status, checkoutUrl: intent.redirectUrl, clientSecret: intent.clientSecret };
    }

    const sub = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "active",
        provider: "free",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600_000),
      },
    });

    await this.entitlement.grantMonthly(userId, plan);
    await this.writeAudit(userId, "subscription.create", "subscription", sub.id, { planCode, provider: "free" });
    return { subscriptionId: sub.id, status: sub.status };
  }

  async cancelSubscription(userId: string) {
    const sub = await this.getSubscription(userId);
    if (!sub) throw new NotFoundException({ code: "NOT_FOUND", message: "没有有效订阅。" });

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
    await this.writeAudit(userId, "subscription.cancel", "subscription", sub.id);
    return { ok: true };
  }

  async handleWebhook(provider: string, eventId: string, payload: unknown) {
    const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      this.logger.warn(`Duplicate webhook event ${eventId} from ${provider}`);
      return { ok: true, duplicate: true };
    }

    await this.prisma.webhookEvent.create({
      data: { provider, eventId, payload: payload as Prisma.InputJsonValue },
    });

    this.logger.log(`Webhook received: ${provider}/${eventId}`);
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });

    return { ok: true };
  }

  private async writeAudit(actorId: string | null, action: string, targetType: string, targetId: string, meta?: Record<string, unknown>) {
    await this.prisma.auditLog.create({
      data: { actorId, action, targetType, targetId, meta: meta ? (meta as Prisma.InputJsonValue) : undefined },
    });
  }
}
