import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { JwtPayload } from "./strategies/jwt.strategy";

@ApiTags("user")
@Controller("user")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("profile")
  async getProfile(@CurrentUser() user: JwtPayload) {
    const u = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, displayName: true, email: true, role: true, status: true, avatarKey: true, createdAt: true },
    });
    return u;
  }

  @Put("profile")
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { displayName?: string; avatarKey?: string },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.avatarKey !== undefined ? { avatarKey: body.avatarKey } : {}),
      },
      select: { id: true, displayName: true, email: true, role: true, avatarKey: true },
    });
    return updated;
  }
}
