import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { paginationQuery } from "@music/contracts";
import { TracksService } from "./tracks.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { rateLimit } from "../../common/rate-limit.guard";

@ApiTags("tracks")
@Controller("tracks")
export class TracksController {
  constructor(private readonly tracks: TracksService) {}

  // ── Publish ──
  @Post("publish")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 20, keyPrefix: "track-publish" }))
  async publish(
    @CurrentUser() user: JwtPayload,
    @Body() body: { assetId: string; title: string; description?: string; lyrics?: string; genre?: string; tags?: string[]; language?: string; visibility?: string },
  ) {
    return this.tracks.publish(user.sub, body.assetId, body);
  }

  // ── Catalog ──
  @Get()
  async list(@Query() query: Record<string, string>) {
    const { page, pageSize } = paginationQuery.parse(query);
    return this.tracks.listPublished(page, pageSize, query.genre);
  }

  @Get("search")
  async search(@Query() query: Record<string, string>) {
    const { page, pageSize } = paginationQuery.parse(query);
    const q = query.q ?? "";
    return this.tracks.search(q, page, pageSize);
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.tracks.getById(id);
  }

  @Get(":id/play")
  async play(@Param("id") id: string) {
    const url = await this.tracks.getPlaybackUrl(id);
    return { url };
  }

  // ── Creator ──
  @Get("creator/:creatorId")
  async creatorTracks(@Param("creatorId") creatorId: string, @Query() query: Record<string, string>) {
    const { page, pageSize } = paginationQuery.parse(query);
    return this.tracks.listByCreator(creatorId, page, pageSize);
  }
}
