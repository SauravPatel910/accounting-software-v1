import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppConfigService } from "./app-config.service";
import { SharedModule } from "./shared";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { SecurityModule } from "./security";
import { LoggingModule, LoggingInterceptor } from "./logging";
import { DemoModule } from "./demo/demo.module";
import {
  appConfig,
  databaseConfig,
  supabaseConfig,
  jwtConfig,
  securityConfig,
  emailConfig,
  fileUploadConfig,
  businessConfig,
  loggingConfig,
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
        loggingConfig,
      ],
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    SharedModule,
    HealthModule,
    AuthModule,
    SecurityModule,
    LoggingModule,
    DemoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppConfigService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [AppConfigService],
})
export class AppModule {}
