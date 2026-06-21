import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FeatureFlagsService } from "../../common/feature-flags.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("admin")
@Controller("admin/feature-flags")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class FeatureFlagsController {
  constructor(private readonly ff: FeatureFlagsService) {}

  @Get()
  async getAll() {
    return this.ff.getAll();
  }

  @Post()
  async setFlag(@CurrentUser() user: JwtPayload, @Body() body: { flag: string; enabled: boolean }) {
    await this.ff.setFlag(body.flag, body.enabled, user.sub);
    return { ok: true };
  }
}
