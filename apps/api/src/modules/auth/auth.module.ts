import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { UserController } from "./user.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { EntitlementModule } from "../entitlement/entitlement.module";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
      signOptions: { expiresIn: (process.env.JWT_ACCESS_TTL ?? "900") + "s" },
    }),
    EntitlementModule,
  ],
  controllers: [AuthController, UserController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
