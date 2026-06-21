import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EntitlementService } from "./entitlement.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("entitlement")
@Controller("entitlement")
@UseGuards(JwtAuthGuard)
export class EntitlementController {
  constructor(private readonly entitlement: EntitlementService) {}

  @Get("balance")
  async getBalance(@CurrentUser() user: JwtPayload) {
    const balance = await this.entitlement.getBalance(user.sub);
    return { balance };
  }
}
