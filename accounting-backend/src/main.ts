import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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

  // Swagger API Documentation
  if (!configService.isProduction) {
    const config = new DocumentBuilder()
      .setTitle("Accounting Software API")
      .setDescription("Comprehensive API for accounting software backend")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .addApiKey(
        {
          type: "apiKey",
          name: "X-API-Key",
          in: "header",
          description: "API Key for external integrations",
        },
        "API-Key",
      )
      .addServer(
        `http://localhost:${configService.port}/${configService.globalPrefix}`,
        "Development Server",
      )
      .addTag("Authentication", "User authentication and authorization")
      .addTag("Users", "User management operations")
      .addTag("Companies", "Company management operations")
      .addTag("Accounts", "Chart of accounts management")
      .addTag(
        "Transactions",
        "Transaction management and double-entry bookkeeping",
      )
      .addTag("Invoices", "Invoice management operations")
      .addTag("Audit Logs", "Audit trail and compliance operations")
      .addTag("Reports", "Financial reporting and analytics")
      .addTag("Health", "System health and monitoring")
      .setContact(
        "API Support",
        "https://github.com/SauravPatel910/accounting-software-v1",
        "support@accountingsoftware.com",
      )
      .setLicense(
        "MIT",
        "https://github.com/SauravPatel910/accounting-software-v1/blob/main/LICENSE",
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
      deepScanRoutes: true,
    });

    SwaggerModule.setup("api/docs", app, document, {
      customSiteTitle: "Accounting Software API Docs",
      customfavIcon: "/favicon.ico",
      customCss: `
        .topbar-wrapper .link {
          content: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RUREMUI4NkIzREI0MTFFQzlGQ0Y5RTU4RjZCRDJBQkMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RUREMUI4NkMyREI0MTFFQ');
          height: 40px;
          width: auto;
        }
        .swagger-ui .topbar { background-color: #1f2937; }
        .swagger-ui .info .title { color: #3b82f6; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: "list",
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
      },
    });

    console.log(
      `📚 API Documentation available at: http://localhost:${configService.port}/api/docs`,
    );
  }

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
