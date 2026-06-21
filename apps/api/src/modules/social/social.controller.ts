import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SocialService } from "./social.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { rateLimit } from "../../common/rate-limit.guard";

@ApiTags("social")
@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Post("tracks/:id/like")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 60, keyPrefix: "like" }))
  async like(@Param("id") trackId: string, @CurrentUser() user: JwtPayload) {
    return this.social.like(user.sub, trackId);
  }

  @Post("users/:id/follow")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 30, keyPrefix: "follow" }))
  async follow(@Param("id") creatorId: string, @CurrentUser() user: JwtPayload) {
    return this.social.follow(user.sub, creatorId);
  }

  @Post("playlists")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 20, keyPrefix: "playlist-create" }))
  async createPlaylist(@CurrentUser() user: JwtPayload, @Body() body: { title: string; isPublic?: boolean }) {
    return this.social.createPlaylist(user.sub, body.title, body.isPublic);
  }

  @Post("playlists/:id/tracks")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 60, keyPrefix: "playlist-add" }))
  async addToPlaylist(@Param("id") playlistId: string, @CurrentUser() user: JwtPayload, @Body() body: { trackId: string }) {
    return this.social.addToPlaylist(playlistId, user.sub, body.trackId);
  }

  @Delete("playlists/:id/tracks/:trackId")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 60, keyPrefix: "playlist-remove" }))
  async removeFromPlaylist(@Param("id") playlistId: string, @Param("trackId") trackId: string, @CurrentUser() user: JwtPayload) {
    return this.social.removeFromPlaylist(playlistId, user.sub, trackId);
  }

  @Get("playlists")
  @UseGuards(JwtAuthGuard)
  async getPlaylists(@CurrentUser() user: JwtPayload) {
    return this.social.getPlaylists(user.sub);
  }

  @Get("playlists/public")
  async listPublicPlaylists() {
    return this.social.listPublicPlaylists();
  }

  @Get("playlists/public/:id")
  async getPublicPlaylist(@Param("id") playlistId: string) {
    return this.social.getPublicPlaylist(playlistId);
  }

  @Get("listening/recent")
  async getRecentTracks(@Query("deviceId") deviceId?: string, @Query("limit") limit = 6) {
    return this.social.getRecentTracks(deviceId, +limit);
  }

  @Post("tracks/:id/play")
  @UseGuards(rateLimit({ windowSec: 60, maxRequests: 120, keyPrefix: "play" }))
  async recordPlay(
    @Param("id") trackId: string,
    @Body() body: { deviceId?: string; msPlayed?: number; completed?: boolean; source?: string },
  ) {
    await this.social.recordPlay(trackId, undefined, body.deviceId, body.msPlayed, body.completed, body.source);
    return { ok: true };
  }

  @Post("tracks/:id/comments")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 12, keyPrefix: "comment" }))
  async addComment(@Param("id") trackId: string, @CurrentUser() user: JwtPayload, @Body() body: { content: string; parentId?: string }) {
    return this.social.addComment(trackId, user.sub, body.content, body.parentId);
  }

  @Post("tracks/:id/report")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 300, maxRequests: 10, keyPrefix: "report" }))
  async reportTrack(@Param("id") trackId: string, @CurrentUser() user: JwtPayload, @Body() body: { reason: string }) {
    return this.social.reportTrack(trackId, user.sub, body.reason);
  }

  @Get("tracks/:id/comments")
  async getComments(@Param("id") trackId: string, @Query("page") page = 1, @Query("pageSize") pageSize = 20) {
    return this.social.getComments(trackId, +page, +pageSize);
  }

  @Delete("comments/:id")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 30, keyPrefix: "comment-delete" }))
  async deleteComment(@Param("id") commentId: string, @CurrentUser() user: JwtPayload) {
    return this.social.deleteComment(commentId, user.sub);
  }
}
