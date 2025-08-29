import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AppConfigService } from "./app-config.service";
import { SecurityHeadersService } from "./security";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration services
  const configService = app.get(AppConfigService);
  const securityHeadersService = app.get(SecurityHeadersService);

  // Set global prefix for all routes
  app.setGlobalPrefix(configService.globalPrefix);

  // Apply security headers with Helmet
  app.use(helmet(securityHeadersService.getHelmetConfig()));

  // Apply custom security headers and logging
  app.use(securityHeadersService.setCustomSecurityHeaders());
  app.use(securityHeadersService.securityLogger());

  // Enable CORS with enhanced configuration
  const corsConfig = securityHeadersService.getCorsConfig();
  app.enableCors(corsConfig);

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
  console.log(`🔗 CORS enabled for: ${JSON.stringify(corsConfig.origin)}`);
  console.log(`🛡️  Security headers enabled`);
  console.log(`⚡ Rate limiting enabled`);
}

bootstrap().catch((error) => {
  console.error("❌ Error starting server:", error);
  process.exit(1);
});
