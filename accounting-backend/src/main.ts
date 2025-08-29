import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AppConfigService } from "./app-config.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(AppConfigService);

  // Set global prefix for all routes
  app.setGlobalPrefix(configService.globalPrefix);

  // Enable CORS
  app.enableCors({
    origin: configService.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: configService.isProduction,
    }),
  );

  // Start the application
  await app.listen(configService.port);

  console.log(
    `🚀 Application is running on: http://localhost:${configService.port}/${configService.globalPrefix}`,
  );
  console.log(`📝 Environment: ${configService.app.nodeEnv}`);
  console.log(`🔗 CORS enabled for: ${configService.corsOrigins.join(", ")}`);
}

bootstrap().catch((error) => {
  console.error("❌ Error starting server:", error);
  process.exit(1);
});
