import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { registerInput, loginInput } from "@music/contracts";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { rateLimit } from "../../common/rate-limit.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Body() body: unknown) {
    const input = registerInput.parse(body);
    return this.auth.register(input);
  }

  @Post("login")
  @HttpCode(200)
  @UseGuards(rateLimit({ windowSec: 60, maxRequests: 10 }))
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = loginInput.parse(body);
    return this.auth.login(input, res);
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return { code: "UNAUTHENTICATED", message: "无有效刷新令牌。" };
    }
    return this.auth.refresh(token, res);
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.auth.logout(res);
    return { ok: true };
  }
}
