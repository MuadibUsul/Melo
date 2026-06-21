import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("metrics")
  async metrics() {
    return this.admin.getMetrics();
  }

  @Get("costs")
  async costs() {
    return this.admin.getCosts();
  }

  @Get("billing")
  async billing(@Query() query: Record<string, string>) {
    const page = parseInt(query.page ?? "1");
    const pageSize = parseInt(query.pageSize ?? "20");
    return this.admin.listSubscriptions(page, pageSize);
  }

  // ── Users ──
  @Get("users")
  async users(@Query() query: Record<string, string>) {
    const page = parseInt(query.page ?? "1");
    const pageSize = parseInt(query.pageSize ?? "20");
    return this.admin.listUsers(page, pageSize);
  }

  @Post("users/:id/role")
  async updateRole(@Param("id") userId: string, @Body() body: { role: string }) {
    return this.admin.updateUserRole(userId, body.role);
  }

  @Post("users/:id/suspend")
  async suspend(@Param("id") userId: string) {
    return this.admin.suspendUser(userId);
  }

  // ── Moderation ──
  @Get("moderation")
  async moderation(@Query() query: Record<string, string>) {
    const page = parseInt(query.page ?? "1");
    const pageSize = parseInt(query.pageSize ?? "20");
    return this.admin.getModerationQueue(page, pageSize);
  }

  @Post("moderation/:id/review")
  async review(
    @Param("id") caseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { decision: "approved" | "rejected"; reason?: string },
  ) {
    return this.admin.reviewCase(caseId, body.decision, user.sub, body.reason);
  }

  // ── Audit Logs ──
  @Get("audit-logs")
  async auditLogs(@Query() query: Record<string, string>) {
    const page = parseInt(query.page ?? "1");
    const pageSize = parseInt(query.pageSize ?? "50");
    return this.admin.getAuditLogs(page, pageSize);
  }

  // ── Seed ──
  @Post("seed")
  async seed() {
    return this.admin.seedAll();
  }
}
