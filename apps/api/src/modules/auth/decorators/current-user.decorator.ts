import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../strategies/jwt.strategy";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!req.user) {
      throw new Error("CurrentUser used without JwtAuthGuard");
    }
    return req.user;
  },
);
