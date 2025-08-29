import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppConfigService } from "./app-config.service";
import { SharedModule } from "./shared";
import { HealthModule } from "./health/health.module";
import {
  appConfig,
  databaseConfig,
  supabaseConfig,
  jwtConfig,
  securityConfig,
  emailConfig,
  fileUploadConfig,
  businessConfig,
} from "./config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [`.env.${process.env.NODE_ENV || "development"}`, ".env"],
      load: [
        appConfig,
        databaseConfig,
        supabaseConfig,
        jwtConfig,
        securityConfig,
        emailConfig,
        fileUploadConfig,
        businessConfig,
      ],
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    SharedModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
  exports: [AppConfigService],
})
export class AppModule {}
