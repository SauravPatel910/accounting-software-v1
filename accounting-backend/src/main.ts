import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // Frontend URLs
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global prefix for API routes
  app.setGlobalPrefix("api/v1");

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle("Accounting Software API")
    .setDescription("Professional accounting software backend API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Auth", "Authentication endpoints")
    .addTag("Companies", "Company management")
    .addTag("Accounts", "Chart of accounts")
    .addTag("Transactions", "Financial transactions")
    .addTag("Invoices", "Invoice management")
    .addTag("Customers", "Customer management")
    .addTag("Products", "Product/Service management")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start the server
  const port = configService.get<number>("app.port") || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
