import { Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ChartsService } from "./charts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("charts")
@Controller("charts")
export class ChartsController {
  constructor(private readonly charts: ChartsService) {}

  @Get("hot")
  async hot() {
    return this.charts.getHotChart();
  }

  @Get("new")
  async news() {
    return this.charts.getNewChart();
  }

  @Get("genre")
  async genre(@Query("genre") genre: string) {
    return this.charts.getGenreChart(genre ?? "中文流行");
  }

  @Get("creators")
  async creators() {
    return this.charts.getCreatorChart();
  }

  @Post("admin/generate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  async generate(@Query("type") type = "hot", @Query("period") period = "daily") {
    return this.charts.generateChartSnapshot(type, period);
  }

  @Post("admin/decay")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  async decay(@Query("factor") factor = "0.9") {
    await this.charts.applyDecay(parseFloat(factor));
    return { ok: true };
  }
}
