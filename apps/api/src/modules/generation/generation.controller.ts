import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createJobInput, paginationQuery } from "@music/contracts";
import { GenerationService } from "./generation.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { rateLimit } from "../../common/rate-limit.guard";

@ApiTags("generation")
@Controller("generation")
export class GenerationController {
  constructor(private readonly generation: GenerationService) {}

  @Post("jobs")
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 20, keyPrefix: "generation-create" }))
  async createJob(
    @Body() body: unknown,
    @CurrentUser() user: JwtPayload,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    const input = createJobInput.parse(body);
    const { job, isDuplicate } = await this.generation.createJob(
      user.sub,
      input.type,
      input.mode,
      input.params,
      idempotencyKey,
      input.parentJobId,
    );
    return { ...job, isDuplicate };
  }

  @Get("jobs")
  @UseGuards(JwtAuthGuard)
  async listJobs(@CurrentUser() user: JwtPayload, @Query() query: Record<string, string>) {
    const { page, pageSize } = paginationQuery.parse(query);
    return this.generation.listUserJobs(user.sub, page, pageSize);
  }

  @Get("jobs/:id")
  @UseGuards(JwtAuthGuard)
  async getJob(@Param("id") id: string) {
    return this.generation.getJob(id);
  }

  @Post("jobs/:id/cancel")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, rateLimit({ windowSec: 60, maxRequests: 30, keyPrefix: "generation-cancel" }))
  async cancelJob(@Param("id") id: string) {
    return this.generation.cancelJob(id);
  }
}
