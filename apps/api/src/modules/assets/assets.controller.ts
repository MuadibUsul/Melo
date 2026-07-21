import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { paginationQuery } from "@music/contracts";
import { AssetsService } from "./assets.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("assets")
@Controller("assets")
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query() query: Record<string, string>) {
    const { page, pageSize } = paginationQuery.parse(query);
    return this.assets.list(user.sub, page, pageSize);
  }

  @Post("upload-url")
  async prepareUpload(
    @CurrentUser() user: JwtPayload,
    @Body() body: { filename?: string; contentType?: string; sizeBytes?: number; usage?: string },
  ) {
    return this.assets.prepareUpload(user.sub, body);
  }

  @Get(":id")
  async get(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.assets.getById(id, user.sub);
  }

  @Get(":id/play")
  async play(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    const url = await this.assets.getPlaybackUrl(id, user.sub);
    return { url };
  }

  @Get(":id/download")
  async download(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    const url = await this.assets.getDownloadUrl(id, user.sub);
    return { url };
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    await this.assets.delete(id, user.sub);
    return { ok: true };
  }
}
