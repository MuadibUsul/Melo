import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

/**
 * Voice clone consent service (plan §4 compliance).
 * Records user consent before enabling voice clone.
 * Audit trail via AuditLog.
 */
@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async recordConsent(userId: string, type: "voice_clone" | "commercial_use", ip: string) {
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "consent_granted",
        targetType: type,
        meta: { ip, consentedAt: new Date().toISOString() },
      },
    });
  }

  async hasConsented(userId: string, type: string): Promise<boolean> {
    const entry = await this.prisma.auditLog.findFirst({
      where: { actorId: userId, action: "consent_granted", targetType: type },
      orderBy: { createdAt: "desc" },
    });
    return !!entry;
  }

  async revokeConsent(userId: string, type: string) {
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "consent_revoked",
        targetType: type,
        meta: { revokedAt: new Date().toISOString() },
      },
    });
  }
}
