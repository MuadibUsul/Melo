import { Global, Module } from "@nestjs/common";
import { loadEnv, type AppEnv } from "@music/config";

export const APP_ENV = "APP_ENV";

/** Global provider for the validated, typed environment (plan §5.9). */
@Global()
@Module({
  providers: [{ provide: APP_ENV, useFactory: (): AppEnv => loadEnv() }],
  exports: [APP_ENV],
})
export class AppConfigModule {}
