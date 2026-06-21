import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

/**
 * Payment adapter layer (plan §2B).
 *
 * Currently: mock provider (creates subscription directly).
 * Production: swap Stripe/PayPal/Alipay adapters implementing IPaymentProvider.
 */

export interface IPaymentProvider {
  readonly name: string;
  /** Create a payment intent / order. Returns a client_secret or checkout URL. */
  createIntent(params: {
    userId: string;
    planCode: string;
    amountCents: number;
    currency: string;
  }): Promise<{ providerIntentId: string; clientSecret: string; redirectUrl?: string }>;
  /** Verify a webhook event signature. */
  verifyWebhook(rawBody: Buffer, signature: string): Promise<boolean>;
  /** Process a confirmed payment. */
  handleEvent(event: { type: string; data: Record<string, unknown> }): Promise<{ subscriptionId?: string; status: string }>;
}

@Injectable()
export class PaymentAdapterService {
  private readonly logger = new Logger(PaymentAdapterService.name);
  private provider: IPaymentProvider | null = null;

  constructor(private readonly prisma: PrismaService) {}

  setProvider(provider: IPaymentProvider) {
    this.provider = provider;
    this.logger.log(`Payment provider set to: ${provider.name}`);
  }

  async createPaymentIntent(userId: string, planCode: string, amountCents: number, currency: string) {
    if (!this.provider || process.env.NODE_ENV === "development") {
      // Mock: return a fake intent for development
      const intentId = `pi_mock_${Date.now()}`;
      return { providerIntentId: intentId, clientSecret: `${intentId}_secret`, redirectUrl: null };
    }
    return this.provider.createIntent({ userId, planCode, amountCents, currency });
  }

  async processWebhook(rawBody: Buffer, signature: string, event: { type: string; data: Record<string, unknown> }) {
    if (!this.provider) {
      this.logger.warn("No payment provider configured — using mock webhook processing");
      return { status: "mock_processed" };
    }

    const valid = await this.provider.verifyWebhook(rawBody, signature);
    if (!valid) throw new Error("Invalid webhook signature");

    return this.provider.handleEvent(event);
  }
}

/**
 * Stripe adapter stub (plan §2B: "至少一个真实支付渠道").
 * Swap in real Stripe SDK when ready.
 */
export class StripeAdapter implements IPaymentProvider {
  readonly name = "stripe";

  async createIntent(_params: {
    userId: string;
    planCode: string;
    amountCents: number;
    currency: string;
  }) {
    // Real implementation:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: params.amountCents,
    //   currency: params.currency,
    //   metadata: { userId: params.userId, planCode: params.planCode },
    // });
    return {
      providerIntentId: `pi_${Date.now()}`,
      clientSecret: `pi_${Date.now()}_secret`,
    };
  }

  async verifyWebhook(_rawBody: Buffer, _signature: string) {
    // const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    return true;
  }

  async handleEvent(_event: { type: string; data: Record<string, unknown> }) {
    // switch (event.type) {
    //   case "invoice.paid": activateSubscription(); break;
    //   case "invoice.payment_failed": markPastDue(); break;
    // }
    return { status: "processed", subscriptionId: `sub_${Date.now()}` };
  }
}

/**
 * Alipay adapter stub.
 */
export class AlipayAdapter implements IPaymentProvider {
  readonly name = "alipay";

  async createIntent(params: { userId: string; planCode: string; amountCents: number; currency: string }) {
    return {
      providerIntentId: `alipay_${Date.now()}`,
      clientSecret: `alipay_${Date.now()}_secret`,
      redirectUrl: `https://openapi.alipay.com/gateway.do?order=${params.planCode}`,
    };
  }

  async verifyWebhook(_rawBody: Buffer, _signature: string) {
    return true; // Alipay RSA verify
  }

  async handleEvent(_event: { type: string; data: Record<string, unknown> }) {
    return { status: "processed" };
  }
}
