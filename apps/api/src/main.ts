import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { loadEnv } from "@music/config";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap(): Promise<void> {
  const env = loadEnv(); // fail-fast on bad config
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: true, credentials: true });
  app.use(cookieParser());
  // Security headers applied via NestMiddleware in AppModule
  app.useGlobalFilters(new AllExceptionsFilter());

  if (env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("minimax-music-platform API")
      .setDescription("AI 音乐生成与聆听平台 · 内部 API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(env.API_PORT);
}

void bootstrap();
