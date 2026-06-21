import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { VersionService } from "./version.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("generation")
@Controller("generation")
@UseGuards(JwtAuthGuard)
export class VersionController {
  constructor(private readonly version: VersionService) {}

  @Get("jobs/:id/versions")
  async getVersions(@Param("id") jobId: string) {
    return this.version.getVersionTree(jobId);
  }

  @Get("jobs/compare")
  async compare(@Query("a") a: string, @Query("b") b: string) {
    return this.version.compareVersions(a, b);
  }
}
