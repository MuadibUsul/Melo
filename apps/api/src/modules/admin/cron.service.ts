import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EntitlementService } from "../entitlement/entitlement.service";
import { ChartsService } from "../charts/charts.service";
import { BillingService } from "../billing/billing.service";
import { PresetsService } from "../presets/presets.service";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlement: EntitlementService,
    private readonly charts: ChartsService,
    private readonly billing: BillingService,
    private readonly presets: PresetsService,
  ) {}

  // ── Bootstrap on startup ──

  async onModuleInit() {
    this.logger.log("Running bootstrap seeds...");
    if (!this.prisma.available) {
      this.logger.warn("Database unavailable, skipping bootstrap seeds");
      return;
    }
    try {
      await this.billing.seedDefaultPlans();
      await this.presets.seedOfficialPresets();
      await this.presets.seedVoices();
      this.logger.log("Bootstrap seeds complete");
    } catch (err) {
      this.logger.error(`Bootstrap seed failed: ${(err as Error).message}`);
    }
  }

  // ── Monthly credit reset (1st of each month at 00:05) ──

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async monthlyCreditReset() {
    this.logger.log("Running monthly credit reset...");
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      include: { user: true },
    });

    const plans = await this.prisma.plan.findMany();
    const planMap = new Map(plans.map((p) => [p.id, p]));

    for (const sub of activeSubs) {
      const plan = planMap.get(sub.planId);
      if (!plan) continue;

      try {
        await this.entitlement.grantMonthly(sub.userId, plan);
        this.logger.log(`Granted ${plan.monthlyCredits} credits to ${sub.userId} (plan: ${plan.code})`);
      } catch (err) {
        this.logger.error(`Failed to grant credits to ${sub.userId}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Monthly credit reset complete: ${activeSubs.length} subscriptions processed`);
  }

  // ── Chart generation (every 6 hours) ──

  @Cron(CronExpression.EVERY_6_HOURS)
  async generateCharts() {
    this.logger.log("Generating chart snapshots...");
    try {
      await this.charts.generateChartSnapshot("hot", "6h");
      await this.charts.generateChartSnapshot("new", "6h");
      this.logger.log("Chart snapshots generated");
    } catch (err) {
      this.logger.error(`Chart generation failed: ${(err as Error).message}`);
    }
  }

  // ── Hot chart decay (every hour) ──

  @Cron(CronExpression.EVERY_HOUR)
  async decayCharts() {
    try {
      await this.charts.applyDecay(0.95);
    } catch (err) {
      this.logger.error(`Chart decay failed: ${(err as Error).message}`);
    }
  }

  // ── Subscription expiry check (daily) ──

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkSubscriptionExpiry() {
    const expired = await this.prisma.subscription.updateMany({
      where: {
        status: { in: ["active", "past_due"] },
        currentPeriodEnd: { lt: new Date() },
        cancelAtPeriodEnd: true,
      },
      data: { status: "expired" },
    });
    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} subscriptions`);
    }
  }
}
