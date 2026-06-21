import { Injectable, UnauthorizedException, ConflictException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { PublicUser, UserRole } from "@music/contracts";
import type { RegisterInput, LoginInput } from "@music/contracts";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EntitlementService } from "../entitlement/entitlement.service";
import type { Response } from "express";

const REFRESH_COOKIE = "refresh_token";
const REFRESH_TTL_SEC = Number(process.env.JWT_REFRESH_TTL) || 2_592_000; // 30d

function toPublicUser(user: {
  id: string;
  displayName: string;
  email: string | null;
  role: string;
  avatarKey: string | null;
}): PublicUser {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role as UserRole,
    avatarKey: user.avatarKey,
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly entitlement: EntitlementService,
  ) {}

  async register(input: RegisterInput): Promise<{ user: PublicUser; accessToken: string }> {
    const existing = await this.prisma.user.findFirst({
      where: input.email ? { email: input.email } : { phone: input.phone! },
    });
    if (existing) {
      throw new ConflictException({
        code: "AUTH_EMAIL_TAKEN",
        message: "该邮箱/手机号已被注册。",
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email ?? null,
        phone: input.phone ?? null,
        passwordHash,
        displayName: input.displayName,
        role: "FREE_USER",
      },
    });

    // Auto-grant free plan credits (plan §1.3).
    try {
      const freePlan = await this.entitlement.ensureFreePlan();
      await this.entitlement.grantMonthly(user.id, freePlan);
    } catch (err) {
      // Non-fatal: user can still use the platform; credits can be granted later.
      this.logger.error(`Failed to grant free credits to ${user.id}: ${(err as Error).message}`);
    }

    const publicUser = toPublicUser(user);
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return { user: publicUser, accessToken };
  }

  async login(
    input: LoginInput,
    res: Response,
  ): Promise<{ user: PublicUser; accessToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: input.identifier.includes("@")
        ? { email: input.identifier }
        : { phone: input.identifier },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: "AUTH_INVALID_CREDENTIALS",
        message: "账号或密码错误。",
      });
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: "AUTH_INVALID_CREDENTIALS",
        message: "账号或密码错误。",
      });
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException({
        code: "FORBIDDEN",
        message: "账号已被停用。",
      });
    }

    const publicUser = toPublicUser(user);
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    const refreshToken = this.jwt.sign({ sub: user.id }, { expiresIn: REFRESH_TTL_SEC });
    this.setRefreshCookie(res, refreshToken);
    return { user: publicUser, accessToken };
  }

  async refresh(
    refreshToken: string,
    res: Response,
  ): Promise<{ user: PublicUser; accessToken: string }> {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken);
    } catch {
      throw new UnauthorizedException({
        code: "AUTH_TOKEN_EXPIRED",
        message: "登录已过期，请重新登录。",
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "账号不存在或已停用。",
      });
    }

    const publicUser = toPublicUser(user);
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    const newRefreshToken = this.jwt.sign({ sub: user.id }, { expiresIn: REFRESH_TTL_SEC });
    this.setRefreshCookie(res, newRefreshToken);
    return { user: publicUser, accessToken };
  }

  async logout(res: Response): Promise<void> {
    res.clearCookie(REFRESH_COOKIE, { path: "/", httpOnly: true });
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: REFRESH_TTL_SEC * 1000,
    });
  }
}
