import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PresetsService } from "./presets.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("presets")
@Controller()
export class PresetsController {
  constructor(private readonly presets: PresetsService) {}

  @Get("presets")
  async listOfficial(@Query("type") type?: string) {
    return this.presets.listOfficial(type);
  }

  @Get("presets/my")
  @UseGuards(JwtAuthGuard)
  async listMy(@CurrentUser() user: JwtPayload) {
    return this.presets.listUserPresets(user.sub);
  }

  @Post("presets")
  @UseGuards(JwtAuthGuard)
  async save(@CurrentUser() user: JwtPayload, @Body() body: { type: string; name: string; category?: string; params: Record<string, unknown> }) {
    return this.presets.savePreset(user.sub, body);
  }

  @Delete("presets/:id")
  @UseGuards(JwtAuthGuard)
  async delete(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.presets.deletePreset(id, user.sub);
  }

  @Get("voices")
  async listVoices(@Query("language") language?: string, @Query("gender") gender?: string) {
    return this.presets.listVoices(language, gender);
  }
}
